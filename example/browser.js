import dragResizer from '../index.es6'
import h from 'hyperscript'
import insertCSS from 'insert-css'
import domReady from 'domready'

var fs = require('fs')
var style = fs.readFileSync(__dirname+'/style.css', 'utf8')
insertCSS(style)

domReady(() => {
    document.body.appendChild(h('div.hcontainer',
        h('div.left', 'Left'),
        h('div.middle', 'Middle'),
        h('div.right', 'Right')
    ));

    dragResizer('.hcontainer');

    document.body.appendChild(h('div.vcontainer',
        h('div.top', 'Top'),
        h('div.bottom', 'Bottom')
    ));

    dragResizer('.vcontainer', {type: 'horizontal'});
})