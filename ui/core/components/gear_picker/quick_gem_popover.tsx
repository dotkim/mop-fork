import { Player } from '../../player';
import i18n from '../../../i18n/config';
import { ItemSlot } from '../../proto/common';
import { EquippedItem } from '../../proto_utils/equipped_item';
import { TypedEvent } from '../../typed_event';
import QuickSwapList from '../quick_swap';

export const addQuickGemPopover = (
	player: Player<any>,
	tooltipElement: HTMLElement,
	item: EquippedItem,
	itemSlot: ItemSlot,
	socketIdx: number,
	openDetailTab: () => void,
) => {
	return new QuickSwapList({
		title: i18n.t('gear_picker.quick_popovers.favorite_gems.title'),
		emptyMessage: i18n.t('gear_picker.quick_popovers.favorite_gems.empty_message'),
		tippyElement: tooltipElement,
		tippyConfig: {
			appendTo: document.querySelector('.sim-ui')!,
		},
		item,
		getItems: (currentItem: EquippedItem) => {
			const favoriteGems = player.sim.getFilters().favoriteGems;
			const socketColor = currentItem.curSocketColors(player.isBlacksmithing())[socketIdx];
			const eligibleFavoriteGems = player
				.getGems(socketColor)
				.filter(gem => favoriteGems.includes(gem.id))
				.sort((a, b) => (a.color > b.color ? 1 : -1));

			return eligibleFavoriteGems.map(gem => ({
				item: gem,
				active: currentItem.gems[socketIdx]?.id === gem.id,
			}));
		},
		onItemClick: clickedItem => {
			player.equipItem(TypedEvent.nextEventID(), itemSlot, item.withGem(clickedItem, socketIdx));
		},
		footerButton: {
			label: i18n.t('gear_picker.quick_popovers.favorite_gems.open_gems'),
			onClick: openDetailTab,
		},
	});
};
