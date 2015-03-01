import $ from 'queryselectorall'
import isArray from 'is-array'
import without from 'lodash.without'
import extend from 'extend'
import clickDrag from 'clickdrag'

export default (() => {

    const flexGrowCSS  = {
        flexBasis: 'auto',
        flexGrow: 1,
        flexShrink: 1
    }

    const flexStuntCSS  = {
        flexBasis: 'auto',
        flexGrow: 0,
        flexShrink: 0
    }

    const dragHandleVertCSS = {
        backgroundImage: '-webkit-gradient(linear, 0 0, 100% 0, from(#E5E5E5), to(#D1D1D1));',
        borderLeft: '1px solid #FFF',
        borderRight: '1px solid #8E8E8E',
        cursor: 'ew-resize',
        flexBasis: 'auto',
        flexGrow: 0,
        flexShrink: 0,
        position: 'relative',
        width: '3px',
        zIndex: 10
    }

    const dragHandleHorCSS = {
        backgroundImage: '-webkit-gradient(linear, 0 0, 0, 100%, from(#E5E5E5), to(#D1D1D1));',
        borderTop: '1px solid #FFF',
        borderBottom: '1px solid #8E8E8E',
        cursor: 'ns-resize',
        flexBasis: 'auto',
        flexGrow: 0,
        flexShrink: 0,
        position: 'relative',
        height: '3px',
        zIndex: 10
    }

    // ---

    function css(elem, params) {
        for (var key in params) elem.style[key] = params[key];
    }

    function createElement(type, className) {
        var elem = document.createElement(type);
        elem.className = className;
        return elem;
    }

    function insertBefore(parent, newNode, siblingNode) {
        parent.insertBefore(newNode, siblingNode);
    }

    function getComputedStyle(elem, prop) {
        return window.getComputedStyle(elem)[prop]
    }

    function getSize(elem, prop) {
        if (!elem.style[prop])
            elem.style[prop] = window.getComputedStyle(elem)[prop]
        return parseInt(elem.style[prop], 10)
    }

     function stuntElement(elements, prop) {
        const stunt  = (n) => {
            if (prop)
                n.style[prop] = parseInt(getComputedStyle(n, prop), 10) + 'px'
            css(n, flexStuntCSS)
        }

        if (isArray(elements))
            elements.forEach(stunt)
        else
            stunt(elements)
    }

    function growElement(elem) {
        css(elem, flexGrowCSS)
    }

    // ---

    function setDraggable(elem, next, siblings, isVertical) {
        const prop = isVertical ? 'width': 'height'
        const maxProp = isVertical ? 'maxWidth': 'maxHeight'
        const drag = clickDrag(elem)

        drag.on('start', (e) => {
            const prev = elem.previousSibling
            const previousSize = parseInt(getComputedStyle(prev, prop), 10);
            const nextSize = parseInt(getComputedStyle(next, prop), 10)
            const totalSize = nextSize + previousSize

            if (!next.style[maxProp] || parseInt(next.style[maxProp], 10) !== totalSize)
                next.style[maxProp] = totalSize + 'px'

            if (!prev.style[maxProp] || parseInt(prev.style[maxProp], 10) !== totalSize)
                prev.style[maxProp] = totalSize + 'px'

            //Stunt all previous nodes but the immediate one
            stuntElement(without(siblings, prev), prop)

            //Grow the previous node
            growElement(prev)

            //reset the next
            next.style[prop] = nextSize + 'px'

            //and stunt it
            stuntElement(next)

            //set cursor
            document.body.style.cursor = isVertical ? 'ew-resize' : 'ns-resize'

            elem.lastMousePos = isVertical ? e.clientX : e.clientY;
            e.preventDefault()
            return true
        });

        drag.on('move', (e) => {
            const currMousePos = isVertical ? e.clientX : e.clientY
            const delta = elem.lastMousePos - currMousePos
            const nextSize = getSize(next, prop)
            next.style[prop] = nextSize + delta + 'px'
            elem.lastMousePos = currMousePos
            e.preventDefault()
            return true
        });

        drag.on('end', (e) => {
            e.preventDefault()
            document.body.style.cursor = ''
        });
    }

    function createHandle(container, opts) {
        const childNodes = [].slice.call(opts.childNodes || container.childNodes)
        const type = opts.type || 'vertical'
        const isVertical = type === 'vertical'

        css(container, extend({
            display: 'flex',
            flexDirection: isVertical ? 'row': 'column'
        }, flexGrowCSS));

        childNodes.forEach((child, i) => {
            css(child, extend({
                flexDirection: isVertical ? 'column': 'row',
                flex: getComputedStyle(child, 'flex') || 1
            }))

            //No drag handle for first item
            if(i > 0) {
                let dragHandle = createElement('div', 'drag-handle')
                css(dragHandle, isVertical ? dragHandleVertCSS : dragHandleHorCSS)
                setDraggable(dragHandle, child, childNodes, isVertical)
                insertBefore(container, dragHandle, child)
            }
        });
    };

    return (container, opts = {}) => {
        if (!container)
            throw new Error('Please provider a container')

        $(container).forEach(function(elem) {
            createHandle(elem, opts)
        })
    };
}())