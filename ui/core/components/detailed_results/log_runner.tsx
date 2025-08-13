// @ts-expect-error
import debounce from 'lodash/debounce';
import { ref } from 'tsx-vanilla';

import { SimLog } from '../../proto_utils/logs_parser';
import { TypedEvent } from '../../typed_event.js';
import { fragmentToString } from '../../utils';
import i18n from '../../../i18n/config';
import { BooleanPicker } from '../pickers/boolean_picker.js';
import { ResultComponent, ResultComponentConfig, SimResultData } from './result_component.js';
export class LogRunner extends ResultComponent {
	private virtualScroll: CustomVirtualScroll | null = null;
	readonly showDebugChangeEmitter = new TypedEvent<void>('Show Debug');
	private showDebug = false;
	private ui: {
		search: HTMLInputElement;
		actions: HTMLDivElement;
		buttonToTop: HTMLButtonElement;
		scrollContainer: HTMLDivElement;
		contentContainer: HTMLTableSectionElement;
	};
	cacheOutput: {
		cacheKey: string | null;
		logs: SimLog[] | null;
		logsAsHTML: Element[] | null;
		logsAsText: string[] | null;
	} = { cacheKey: null, logs: null, logsAsHTML: null, logsAsText: null };

	constructor(config: ResultComponentConfig) {
		config.rootCssClass = 'log-runner-root';
		super(config);

		const searchRef = ref<HTMLInputElement>();
		const actionsRef = ref<HTMLDivElement>();
		const buttonToTopRef = ref<HTMLButtonElement>();
		const scrollContainerRef = ref<HTMLDivElement>();
		const contentContainerRef = ref<HTMLTableSectionElement>();

		this.rootElem.appendChild(
			<>
				<div ref={actionsRef} className="log-runner-actions">
					<input ref={searchRef} type="text" className="form-control log-search-input" placeholder={i18n.t('common.logs.filter_placeholder')} />
					<button ref={buttonToTopRef} className="btn btn-primary order-last log-runner-scroll-to-top-btn">
						{i18n.t('common.logs.top_button')}
					</button>
				</div>
				<div ref={scrollContainerRef} className="log-runner-scroll">
					<table className="metrics-table log-runner-table">
						<thead>
							<tr className="metrics-table-header-row">
								<th>{i18n.t('common.logs.time_column')}</th>
								<th>
									<div className="d-flex align-items-end">{i18n.t('common.logs.event_column')}</div>
								</th>
							</tr>
						</thead>
						<tbody ref={contentContainerRef} className="log-runner-logs"></tbody>
					</table>
				</div>
			</>,
		);

		this.ui = {
			search: searchRef.value!,
			actions: actionsRef.value!,
			buttonToTop: buttonToTopRef.value!,
			scrollContainer: scrollContainerRef.value!,
			contentContainer: contentContainerRef.value!,
		};

		// Use the 'input' event to trigger search as the user types
		const onSearchHandler = () => {
			this.searchLogs(this.ui.search.value);
		};
		this.ui.search?.addEventListener('input', debounce(onSearchHandler, 150));
		this.ui.buttonToTop?.addEventListener('click', () => {
			this.virtualScroll?.scrollToTop();
		});
		new BooleanPicker<LogRunner>(this.ui.actions, this, {
			id: 'log-runner-show-debug',
			extraCssClasses: ['show-debug-picker'],
			label: i18n.t('common.logs.show_debug'),
			inline: true,
			reverse: true,
			changedEvent: () => this.showDebugChangeEmitter,
			getValue: () => this.showDebug,
			setValue: (eventID, _logRunner, newValue) => {
				this.showDebug = newValue;
				this.showDebugChangeEmitter.emit(eventID);
			},
		});

		this.showDebugChangeEmitter.on(() => {
			onSearchHandler();
		});
		this.initializeClusterize();
	}

	private initializeClusterize(): void {
		this.virtualScroll = new CustomVirtualScroll({
			scrollContainer: this.ui.scrollContainer,
			contentContainer: this.ui.contentContainer,
			itemHeight: 32,
		});
	}

	searchLogs(searchQuery: string): void {
		// Regular expression to match quoted phrases or words
		const matchQuotesRegex = /"([^"]+)"|\S+/g;
		let match;
		const keywords: any[] = [];
		// Extract keywords and quoted phrases from the search query
		while ((match = matchQuotesRegex.exec(searchQuery))) {
			keywords.push(match[1] ? match[1].toLowerCase() : match[0].toLowerCase());
		}
		const filteredLogs = this.cacheOutput.logsAsHTML?.filter((_, index) => {
			const logText = this.cacheOutput.logsAsText![index];
			const logRaw = this.cacheOutput.logs![index].raw;

			if (!this.showDebug && logRaw.match(/.*\[DEBUG\].*/)) return false;

			return keywords.every(keyword => {
				if (keyword.startsWith('"') && keyword.endsWith('"')) {
					// Remove quotes for exact phrase match
					return logText.includes(keyword.slice(1, -1));
				}
				return logText.includes(keyword);
			});
		});

		if (filteredLogs) {
			this.virtualScroll?.setItems(filteredLogs);
		}
	}

	onSimResult(resultData: SimResultData): void {
		this.getLogs(resultData);
		this.searchLogs(this.ui.search.value);
	}

	getLogs(resultData: SimResultData) {
		if (!resultData) return [];
		const cacheKey = resultData.result.request.requestId;
		if (this.cacheOutput.cacheKey === cacheKey) {
			return this.cacheOutput.logsAsHTML;
		}

		const validLogs = resultData.result.logs.filter(log => !log.isCastCompleted());
		this.cacheOutput.cacheKey = cacheKey;
		this.cacheOutput.logs = validLogs;
		this.cacheOutput.logsAsHTML = validLogs.map(log => this.renderItem(log));
		this.cacheOutput.logsAsText = this.cacheOutput.logsAsHTML.map(element => fragmentToString(element).trim().toLowerCase());
	}

	renderItem(log: SimLog) {
		return (
			<tr>
				<td className="log-timestamp">{log.formattedTimestamp()}</td>
				<td className="log-evdsfent">{log.toHTML(false).cloneNode(true)}</td>
			</tr>
		) as HTMLTableRowElement;
	}
}

class CustomVirtualScroll {
	private scrollContainer: HTMLElement;
	private contentContainer: HTMLElement;
	private items: Element[];
	private itemHeight: number;
	private visibleItemsCount: number;
	private startIndex: number;
	private placeholderTop: HTMLElement;
	private placeholderBottom: HTMLElement;

	constructor({ scrollContainer, contentContainer, itemHeight }: { scrollContainer: HTMLElement; contentContainer: HTMLElement; itemHeight: number }) {
		this.scrollContainer = scrollContainer;
		this.contentContainer = contentContainer;
		this.items = [];
		this.itemHeight = itemHeight;
		this.visibleItemsCount = 50; // +1 for buffer
		this.startIndex = 0;

		this.placeholderTop = document.createElement('div');
		this.placeholderBottom = document.createElement('div');
		contentContainer.prepend(this.placeholderTop);
		contentContainer.append(this.placeholderBottom);

		this.attachScrollListener();
	}

	scrollToTop(): void {
		this.scrollContainer.scrollTop = 0;
		this.startIndex = 0; // Reset startIndex to ensure items are updated correctly
		this.updateVisibleItems(); // Update the visible items after scrolling to top
	}

	setItems(newItems: CustomVirtualScroll['items']): void {
		// Adjust the type of newItems as needed
		this.items = newItems;
		this.scrollToTop();
	}

	private attachScrollListener(): void {
		this.scrollContainer.addEventListener('scroll', () => {
			const newIndex = Math.floor(this.scrollContainer.scrollTop / this.itemHeight);
			if (newIndex !== this.startIndex) {
				this.startIndex = newIndex;
				this.updateVisibleItems();
			}
		});
	}

	private updateVisibleItems(): void {
		const endIndex = this.startIndex + this.visibleItemsCount;
		const visibleItems = this.items.slice(this.startIndex, endIndex);
		const remainingItems = this.items.length - endIndex;

		// Update the height of the placeholders before it's placed in the dom to prevent rerender
		this.placeholderTop.style.height = `${this.startIndex * this.itemHeight}px`;
		this.placeholderBottom.style.height = `${remainingItems * this.itemHeight}px`;
		this.contentContainer.replaceChildren(
			<>
				{this.placeholderTop}
				{visibleItems.map(item => item)}
				{this.placeholderBottom}
			</>,
		);
	}
}
