<a name="start"></a>

Node BufferedReader
===================

#### Fully configurable buffered reader for node.js ####

[Availability](#availability) | [Compatibility](#compatibility) | [Documentation](#documentation)

Version: 0.2.6

When you need to read a file you typically read a chunk of bytes called "buffer" to avoid multiple calls to the underlying I/O layer, so instead of reading directly from the disk, you read from the previous filled buffer. Doing this you win performance.

This library allows you to read files using internal buffers, so you don't have to worry about them. In addition, you can read a text file line by line.

<a name="availability"></a>
#### Availability [↑](#start) ####

Via npm:

```
npm install buffered-reader
```

Or simply copying `build/buffered-reader.js` into your project's directory and `require()` accordingly.

***

<a name="compatibility"></a>
#### Compatibility [↑](#start) ####

✔ Node *

***

<a name="documentation"></a>
#### Documentation [↑](#start) ####
 
[Reference](https://github.com/Gagle/Node-BufferedReader/wiki/Reference)  
[Examples](https://github.com/Gagle/Node-BufferedReader/tree/master/examples)  
[Change Log](https://github.com/Gagle/Node-BufferedReader/wiki/Change-Log)  
[MIT License](https://github.com/Gagle/Node-BufferedReader/blob/master/LICENSE)