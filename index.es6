import $ from 'queryselectorall'
import isArray from 'is-array'
import without from 'lodash.without'
import extend from 'extend'
import clickDrag from 'clickdrag'
import prefix from 'prefix'

export default (() => {

    const flexGrowCSS  = {
        [prefix('flexBasis')]: 'auto',
        [prefix('flexGrow')]: 1,
        [prefix('flexShrink')]: 1
    }

    const flexStuntCSS  = {
        [prefix('flexBasis')]: 'auto',
        [prefix('flexGrow')]: 0,
        [prefix('flexShrink')]: 0
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

    function getContainerCSS(container, isRow) {
        const prop = isRow ? 'width': 'height'
        return {
            display: prefix.dash('flex'),
            [prefix('flexDirection')]: isRow ? 'row': 'column',
            [prop] : container.style[prop] ? container.style[prop]
                                : getComputedStyle(container, [prop])
        }
    }

    function getChildCSS(child, isRow) {
        const flex = getComputedStyle(child, 'flex')
        const defaultFlex = '1 1 0%'

        return {
            [prefix('flex')]: !!flex && flex !== '0 1 auto' ? flex : defaultFlex,
            [prefix('flexDirection')]: isRow ? 'column': 'row',
            ['overflow' + (isRow ? 'X': 'Y')]: 'hidden'
        }
    }

    function setCursor(cursor) {
        document.body.style.cursor = cursor
    }

    function setSelect(val) {
        var el = document.body
        el.style.webkitUserSelect = val
        el.style.MozUserSelect = val
    }

    function setStyle(elem, prop, val){
        elem.style[prop] = val
    }

    // ---

    function setDraggable(elem, next, siblings, isRow) {
        const prop = isRow ? 'width': 'height'
        const maxProp = isRow ? 'maxWidth': 'maxHeight'
        const drag = clickDrag(elem)

        drag.on('start', (e) => {
            const prev = elem.previousSibling
            const previousSize = parseInt(getComputedStyle(prev, prop), 10)
            const nextSize = parseInt(getComputedStyle(next, prop), 10)
            const totalSize = nextSize + previousSize

            if (!next.style[maxProp] || parseInt(next.style[maxProp], 10) !== totalSize)
                setStyle(next, maxProp, totalSize + 'px')

            if (!prev.style[maxProp] || parseInt(prev.style[maxProp], 10) !== totalSize)
                setStyle(prev, maxProp, totalSize + 'px')

            // Stunt all previous nodes but the immediate one
            stuntElement(without(siblings, prev), prop)

            // Grow the previous node
            growElement(prev)

            // Reset the next
            setStyle(next, prop, nextSize + 'px')

            // And stunt it
            stuntElement(next)

            // Set cursor on document
            setCursor(isRow ? 'ew-resize' : 'ns-resize')

            // Disable select
            setSelect('none')

            elem.lastMousePos = isRow ? e.clientX : e.clientY;
            e.preventDefault()
            return true
        });

        drag.on('move', (e) => {
            const currMousePos = isRow ? e.clientX : e.clientY
            const delta = elem.lastMousePos - currMousePos
            const nextSize = getSize(next, prop)
            setStyle(next, prop, nextSize + delta + 'px')
            elem.lastMousePos = currMousePos
            e.preventDefault()
            return true
        });

        drag.on('end', (e) => {
            e.preventDefault()
            setCursor('')
            setSelect('')
        });
    }

    function createHandle(container, opts) {
        const childNodes = [].slice.call(opts.childNodes || container.childNodes);
        const type = opts.type || 'row'
        const isRow = type === 'row'

        let dragHandle = createElement('div', 'drag-handle')
        if (opts.className)
            dragHandle.classList.add(opts.className)

        css(container, extend(getContainerCSS(container, isRow), flexGrowCSS))

        childNodes.forEach((child, i) => {
            css(child, extend(getChildCSS(child, isRow)))

            //No drag handle for first item
            if(i > 0) {
                setDraggable(dragHandle, child, childNodes, isRow)
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