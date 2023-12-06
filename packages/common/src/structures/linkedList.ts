
export interface ILinkedListItem<T> {
    readonly value: T;
    readonly next?: ILinkedListItem<T> | undefined;
    readonly prev?: ILinkedListItem<T> | undefined;

    readonly position: number;

    readonly list: LinkedList<T>;
}

export interface ILinkedList<T> extends Iterable<ILinkedListItem<T>> {
    readonly root: ILinkedListItem<T> | undefined;
    readonly last: ILinkedListItem<T> | undefined;

    readonly length: number;

    add(value: T): ILinkedListItem<T>;
    remove(item: ILinkedListItem<T>): void;
    removeLast(): void;
    removeFirst(): void;
    clear(): void;
}

interface LinkedListItem<T> extends ILinkedListItem<T> {
    next?: LinkedListItem<T>;
    prev?: LinkedListItem<T>;

    position: number;

    list: LinkedList<T>;
}

export class LinkedList<T> implements ILinkedList<T> {

    private _root: LinkedListItem<T> = null;
    private _last: LinkedListItem<T> = null;

    private _length = 0;

    get root(): ILinkedListItem<T> { return this._root; }
    get last(): ILinkedListItem<T> { return this._last; }
    get length() { return this._length; }

    *[Symbol.iterator]() {
        let current = this._root;
        while (current) {
            yield current;
            current = current.next;
        }
    }

    add(value: T) {
        const next: LinkedListItem<T> = {
            value: value,
            list: this,
            position: null,
        };

        this._length++;

        if (!this.root || !this.last) {
            next.position = 0;
            this._root = this._last = next;
        } else {
            next.prev = this._last;
            this._last.next = next;
            this._last = next;
            next.position = this._length - 1;
        }

        return this.last;
    }

    remove(item: ILinkedListItem<T>) {
        if (!item || item.list !== this) {
            return;
        }

        const itemInternal = item as LinkedListItem<T>;
        const { next, prev } = itemInternal;
        let removed = false;

        if (next && next.prev === item) {
            next.prev = prev;

            if (this._root === item) {
                this._root = next;
            }

            removed = true;
        }

        if (prev && prev.next === item) {
            prev.next = next;

            if (this._last === item) {
                this._last = prev;
            }

            removed = true;
        }

        itemInternal.prev = itemInternal.next = null;
        itemInternal.list = undefined;

        if (removed) {
            this._length--;
        }
    }

    removeLast(): void {
        this.remove(this._last);
    }

    removeFirst(): void {
        this.remove(this._root);
    }

    clear(): void {
        for (const item of this) {
            item.next = item.prev = undefined;
            item.list = undefined;
        }

        this._root = this._last = null;
        this._length = 0;
    }
}
