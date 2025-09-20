import { Player } from '../../player';
import i18n from '../../../i18n/config';
import { ItemSlot } from '../../proto/common';
import { UIEnchant as Enchant } from '../../proto/ui.js';
import { EquippedItem } from '../../proto_utils/equipped_item';
import { TypedEvent } from '../../typed_event';
import QuickSwapList from '../quick_swap';

export const addQuickEnchantPopover = (player: Player<any>, tooltipElement: HTMLElement, item: EquippedItem, itemSlot: ItemSlot, openDetailTab: () => void) => {
	return new QuickSwapList({
		title: i18n.t('gear.gear_picker.quick_popovers.favorite_enchants.title'),
		emptyMessage: i18n.t('gear.gear_picker.quick_popovers.favorite_enchants.empty_message'),
		tippyElement: tooltipElement,
		tippyConfig: {
			appendTo: document.querySelector('.sim-ui')!,
		},
		item,
		getItems: (currentItem: EquippedItem) => {
			const eligibleEnchants = player.sim.db.getEnchants(itemSlot);
			const favoriteEnchants = player.sim.getFilters().favoriteEnchants;
			const eligibleFavoriteEnchants = favoriteEnchants
				?.map(favoriteId => {
					const [enchantId, enchantType] = favoriteId.split('-').map(Number);
					return eligibleEnchants.find(enchant => enchant.effectId === enchantId && enchant.type === enchantType);
				})
				.filter((enchant): enchant is Enchant => !!enchant);

			return eligibleFavoriteEnchants.map(enchant => ({
				item: enchant,
				active: currentItem.enchant?.effectId === enchant.effectId,
			}));
		},
		onItemClick: clickedItem => {
			player.equipItem(TypedEvent.nextEventID(), itemSlot, item.withEnchant(clickedItem));
		},
		footerButton: {
			label: i18n.t('gear.gear_picker.quick_popovers.favorite_enchants.open_enchants'),
			onClick: openDetailTab,
		},
	});
};
