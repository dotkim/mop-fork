import tippy from 'tippy.js';

import i18n from '../../../i18n/config';
import { Player } from '../../player.js';
import { ActionID as ActionIdProto, Cooldown } from '../../proto/common.js';
import { ActionId } from '../../proto_utils/action_id.js';
import { EventID, TypedEvent } from '../../typed_event.js';
import { existsInDOM } from '../../utils';
import { Component } from '../component.js';
import { IconEnumPicker, IconEnumValueConfig } from '../pickers/icon_enum_picker.jsx';
import { NumberListPicker } from '../pickers/number_list_picker.js';

export class CooldownsPicker extends Component {
	readonly player: Player<any>;

	private cooldownPickers: Array<HTMLElement>;

	constructor(parentElem: HTMLElement, player: Player<any>) {
		super(parentElem, 'cooldowns-picker-root');
		this.player = player;
		this.cooldownPickers = [];

		const events = TypedEvent.onAny([this.player.rotationChangeEmitter, this.player.sim.unitMetadataEmitter]).on(() => {
			if (!existsInDOM(this.rootElem)) {
				this.dispose();
				return;
			}
			this.update();
		});
		this.addOnDisposeCallback(() => {
			this.rootElem.remove();
			this.cooldownPickers.forEach(picker => picker.remove());
			events.dispose();
		});
		this.update();
	}

	private update() {
		this.rootElem.innerHTML = '';
		const cooldowns = this.player.getSimpleCooldowns().cooldowns;

		this.cooldownPickers = [];
		for (let i = 0; i < cooldowns.length + 1; i++) {
			const cooldown = cooldowns[i];

			const row = document.createElement('div');
			row.classList.add('cooldown-picker');
			if (i == cooldowns.length) {
				row.classList.add('add-cooldown-picker');
			}
			this.rootElem.appendChild(row);

			const actionPicker = this.makeActionPicker(row, i);

			const label = document.createElement('label');
			label.classList.add('cooldown-picker-label', 'form-label');
			if (cooldown && cooldown.id) {
				ActionId.fromProto(cooldown.id)
					.fill(this.player.getRaidIndex())
					.then(filledId => (label.textContent = filledId.name));
			}
			row.appendChild(label);

			const timingsPicker = this.makeTimingsPicker(row, i);

			const deleteButtonFragment = document.createElement('fragment');
			deleteButtonFragment.innerHTML = `
				<button class="delete-cooldown link-danger">
					<i class="fa fa-times fa-xl"></i>
				</button>
			`;
			const deleteButton = deleteButtonFragment.children[0] as HTMLElement;
			const deleteButtonTooltip = tippy(deleteButton, { content: i18n.t('rotation_tab.cooldowns.delete_tooltip') });
			deleteButton.addEventListener('click', () => {
				const newCooldowns = this.player.getSimpleCooldowns();
				newCooldowns.cooldowns.splice(i, 1);
				this.player.setSimpleCooldowns(TypedEvent.nextEventID(), newCooldowns);
				deleteButtonTooltip.hide();
			});
			row.appendChild(deleteButton);

			this.cooldownPickers.push(row);
		}
	}

	private makeActionPicker(parentElem: HTMLElement, cooldownIndex: number): IconEnumPicker<Player<any>, ActionIdProto> {
		const availableCooldowns = this.player
			.getMetadata()
			.getSpells()
			.filter(spell => spell.data.isMajorCooldown)
			.map(spell => spell.id)
			.filter(actionId => {
				const id = actionId.spellId !== 0 ? actionId.spellId : actionId.itemId;
				return !this.player.hiddenMCDs.includes(id);
			});

		this.rootElem.closest('.cooldown-settings')?.classList[availableCooldowns.length ? 'remove' : 'add']('hide');

		const actionPicker = new IconEnumPicker<Player<any>, ActionIdProto>(parentElem, this.player, {
			extraCssClasses: ['cooldown-action-picker'],
			numColumns: 3,
			values: ([{ color: '#grey', value: ActionIdProto.create() }] as Array<IconEnumValueConfig<Player<any>, ActionIdProto>>).concat(
				availableCooldowns.map(cooldownAction => {
					return { actionId: cooldownAction, value: cooldownAction.toProto() };
				}),
			),
			equals: (a: ActionIdProto, b: ActionIdProto) => ActionIdProto.equals(a, b),
			zeroValue: ActionIdProto.create(),
			backupIconUrl: (value: ActionIdProto) => ActionId.fromProto(value),
			changedEvent: (player: Player<any>) => player.rotationChangeEmitter,
			getValue: (player: Player<any>) => player.getSimpleCooldowns().cooldowns[cooldownIndex]?.id || ActionIdProto.create(),
			setValue: (eventID: EventID, player: Player<any>, newValue: ActionIdProto) => {
				if (!newValue.rawId.oneofKind) return;
				const newCooldowns = player.getSimpleCooldowns();

				while (newCooldowns.cooldowns.length < cooldownIndex) {
					newCooldowns.cooldowns.push(Cooldown.create());
				}
				newCooldowns.cooldowns[cooldownIndex] = Cooldown.create({
					id: newValue,
					timings: [],
				});

				player.setSimpleCooldowns(eventID, newCooldowns);
			},
		});
		return actionPicker;
	}

	private makeTimingsPicker(parentElem: HTMLElement, cooldownIndex: number): NumberListPicker<Player<any>> {
		const actionPicker = new NumberListPicker(parentElem, this.player, {
			id: `cooldown-timings-${cooldownIndex}`,
			extraCssClasses: ['cooldown-timings-picker'],
			placeholder: i18n.t('rotation_tab.cooldowns.timings_placeholder'),
			changedEvent: (player: Player<any>) => player.rotationChangeEmitter,
			getValue: (player: Player<any>) => {
				return player.getSimpleCooldowns().cooldowns[cooldownIndex]?.timings || [];
			},
			setValue: (eventID: EventID, player: Player<any>, newValue: Array<number>) => {
				const newCooldowns = player.getSimpleCooldowns();
				newCooldowns.cooldowns[cooldownIndex].timings = newValue;
				player.setSimpleCooldowns(eventID, newCooldowns);
			},
			enableWhen: (player: Player<any>) => {
				const curCooldown = player.getSimpleCooldowns().cooldowns[cooldownIndex];
				return curCooldown && !ActionIdProto.equals(curCooldown.id, ActionIdProto.create());
			},
		});
		return actionPicker;
	}
}
