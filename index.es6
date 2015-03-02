import $ from 'queryselectorall'
import isArray from 'is-array'
import without from 'lodash.without'
import extend from 'extend'
import clickDrag from 'clickdrag'

export default (() => {

    const flexGrowCSS  = {
        [w('flexBasis')]: 'auto',
        [w('flexGrow')]: 1,
        [w('flexShrink')]: 1
    }

    const flexStuntCSS  = {
        [w('flexBasis')]: 'auto',
        [w('flexGrow')]: 0,
        [w('flexShrink')]: 0
    }

    const dragHandleRowCSS = {
        backgroundImage: '-webkit-gradient(linear, 0 0, 100% 0, from(#E5E5E5), to(#D1D1D1));',
        borderLeft: '1px solid #FFF',
        borderRight: '1px solid #8E8E8E',
        cursor: 'ew-resize',
        position: 'relative',
        width: '3px',
        zIndex: 10
    }

    const dragHandleColCSS = {
        backgroundImage: '-webkit-gradient(linear, 0 0, 0, 100%, from(#E5E5E5), to(#D1D1D1));',
        borderTop: '1px solid #FFF',
        borderBottom: '1px solid #8E8E8E',
        cursor: 'ns-resize',
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

    function getContainerCSS(container, isRow) {
        const prop = isRow ? 'width': 'height'
        return {
            display: (isWebkit() ? '-webkit-flex' :'flex'),
            [w('flexDirection')]: isRow ? 'row': 'column',
            [prop] : container.style[prop] ? container.style[prop]
                                : getComputedStyle(container, [prop])
        }
    }

    function isWebkit() {
        return typeof document.body.style['webkitFlex'] !== 'undefined'
    }

    function w(prop) {
        return isWebkit() ? 'webkit' + (prop.charAt(0).toUpperCase() + prop.slice(1, prop.length)) : prop
    }

    function getChildCSS(child, isRow) {
        const flex = getComputedStyle(child, 'flex')
        const defaultFlex = '1 1 0%'

        return {
            [w('flex')]: !!flex && flex !== '0 1 auto' ? flex : defaultFlex,
            [w('flexDirection')]: isRow ? 'column': 'row',
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

            //Stunt all previous nodes but the immediate one
            stuntElement(without(siblings, prev), prop)

            //Grow the previous node
            growElement(prev)

            //reset the next
            setStyle(next, prop, nextSize + 'px')

            //and stunt it
            stuntElement(next)

            //set cursor on document
            setCursor(isRow ? 'ew-resize' : 'ns-resize')

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

    function createHandle(container, opts, isRow) {
        const childNodes = [].slice.call(opts.childNodes || container.childNodes);
        let dragHandle;

        if (opts.dragHandle) {
            dragHandle = opts.dragHandle.elem
            css(dragHandle, isRow ? opts.dragHandle.row : opts.dragHandle.column)
        }
        else {
            dragHandle = createElement('div', 'drag-handle')
            css(dragHandle, isRow ? dragHandleRowCSS : dragHandleColCSS)
        }

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

        const type = opts.type || 'row'
        const isRow = type === 'row'
        if (opts.dragHandle) {
            if (!opts.dragHandle.elem) throw new Error('Please provide a drag handle element.')
            if (isRow && !opts.dragHandle.row) throw new Error('Please provide the drag handle css with row prop.')
            if (!isRow && !opts.dragHandle.column) throw new Error('Please provide the drag handle css with column prop.')
        }
        $(container).forEach(function(elem) {
            createHandle(elem, opts, isRow)
        })
    };
}())