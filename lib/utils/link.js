module.exports = function Link() {
    var _head, _tail;
    var _count = 0;

    this.head = () => {
        return _head;
    }

    this.tail = () => {
        return _tail;
    }

    this.count = () => {
        return _count;
    }

    this.addHead = (data, timestamp) => {
        var node = {
            next: _head,
            data: data
        };

        if (_head)
            _head.prev = node;
        else
            _tail = node;

        _head = node;

        _count++;

        return node;
    };

    this.addTail = (data, timestamp) => {
        var node = {
            prev: _tail,
            data: data
        };

        if (_tail)
            _tail.next = node;
        else
            _head = node;

        _tail = node;

        _count++;

        return node;
    };

    this.remove = node => {
        if (_head === node)
            _head = node.next;
        else
            node.prev.next = node.next;

        if (_tail === node)
            _tail = node.prev;
        else
            node.next.prev = node.prev;

        _count--;

        return _count;
    };

    this.toJSON = () => {
        var a = [];

        var node = _head;
        while (node !== undefined) {
            a.push(node.data);
            node = node.next;
        }
        return a;
    }
};