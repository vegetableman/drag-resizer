# drag-resizer

Adds a drag handle for dom nodes, uses flexbox.

![img](https://raw.githubusercontent.com/vegetableman/drag-resizer/master/example.gif)

```js
  const dragResizer = require('drag-resizer')
  dragResizer('.container') // dragResizer(document.querySelector('.container'))
```

Pass the container with the child nodes to be manipulated by the drag handle.

## Installation

`npm install drag-resizer --save`


## Usage

#### `dragResizer(element, opts)`

Creates a new dragResizer for an element with the given options.

- `type` - The type of flexbox (row|column), default type row.
- `childNodes` - Array of child nodes manipulated by the handle, default immediate child nodes of the element.
- `className` - Class name for the drag handle.

## demo

To run the demo from source, clone this repo and follow these steps:

```sh
git clone https://github.com/vegetableman/drag-resizer.git
cd drag-resizer
npm install

## now run the demo
npm run example
```
