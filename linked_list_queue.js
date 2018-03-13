class Node {
  constructor(key, item) {
    this.item_ = item;
    this.key_ = key;
    this.next_;
    this.previous_;
  }

  getItem() {
    return this.item_;
  }

  setNext(node) {
    this.next_ = node;
  }

  setPrevious(node) {
    this.previous_ = node;
  }

  getNext() {
    return this.next_;
  }

  getPrevious() {
    return this.previous_;
  }

  getKey() {
    return this.key_;
  }
}

class LinkedListQueue {
  constructor(maxSize) {
    this.maxSize_ = maxSize;
    this.size_ = 0;
    this.head_;
    this.tail_;
    this.nodeForKey_ = {};
  }

  getItemForKey(key) {
    let node = this.nodeForKey_[key];
    if (node) {
      this.moveNodeToBack_(node);
      return node.getItem();
    }
  }

  add(key, item) {
    if (this.maxSize_ === 0) {
      return;
    }

    let node = new Node(key, item);

    if (this.tail_) {
      let oldTail = this.tail_;
      oldTail.setNext(node);
      node.setPrevious(oldTail);
    }

    this.tail_ = node;
    ++this.size_;

    if (!this.head_) {
      this.head_ = node;
    }

    this.nodeForKey_[key] = item;
    this.ejectHeadIfTooBig_();
  }

  moveNodeToBack_(node) {
    if (node === this.tail_) {
      return;
    }

    let previous = node.getPrevious();
    let next = node.getNext();

    if (previous) {
      previous.setNext(next);
    }
    if (next) {
      next.setPrevious(previous);
    }

    node.setPrevious(this.tail_);
    node.setNext(undefined);

    this.tail_ = node;
  }

  ejectHeadIfTooBig_() {
    if (this.size_ <= this.maxSize_) {
      return;
    }

    let oldHead = this.head_;
    this.head_ = oldHead.getNext();
    this.head_.setPrevious(undefined);
    delete this.nodeForKey_[oldHead.getKey()];
    --this.size_;
  }
}

module.exports = {
  LinkedListQueue,
}