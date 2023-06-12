'use strict'


let isNode = typeof module !== 'undefined' && module.exports && true || false


/* ###############

   CONSTRUCTOR

 ############### */


class PixyBrowser {

    constructor ( opt ) {

        const { container, callback, width, height, url, type } = opt

        this.consoleOn = false
        this.window = {}
        this.type = type || 'matrix'
        this.zoomLevel = 1
        this.bitmap = {}

        if ( width && height ) {

            this.window.screen = {

                height: height,
                width: width

            }
        
            PixyBrowser.initPixy.call( this, opt )

        } else

            this.container = container

        isNode && PixyBrowser.serverRun.call( this, opt )

        !isNode && url && PixyBrowser.loadFileAsync( url ).then( data => PixyBrowser.load.call( this, data, callback ) )
    
        this.createElement = tag => { return PixyBrowser.createElement.call( this, tag ) }
        this.createTextNode = txt => { return PixyBrowser.createTextNode.call( this, txt ) }
        this.zoom = z => PixyBrowser.zoom.call( this, z )
        this.debug = () => PixyBrowser.debug.call( this )

    }

}


/* ###############

   COMMON METHODS

 ############### */


PixyBrowser.build = function ( doc ) {

    this.document && (this.document.busy = true)

    const tp = {
            ARRAY: Symbol( 'ARRAY' ),
            FUNCTION: Symbol( 'FUNCTION' ),
            OBJECT: Symbol( 'OBJECT' ),
            STRING: Symbol( 'STRING' )
        }

    const setprop = ( e, p ) => {
        for ( let a in p )
            e[a] = p[a]
    }

    const iterables = {

        [tp.ARRAY]: ( dat, ctr ) => {
            for ( let a = 0, an = dat.length; a < an; a += 1 )            
                ( {
                    [tp.OBJECT]: () => iterables[tp.OBJECT]( dat[a], ctr ),
                    [tp.STRING]: () => ctr.appendChild( ( this.pixy && this || document ).createTextNode(dat[a]) )
                } )[detect( dat[a] )]()
        },

        [tp.OBJECT]: ( dat, ctr ) => {

            let a
            for ( a in dat )
                break
            let element = ( this.pixy && this || document ).createElement( a )
            setprop( element, dat[a].prop )
            ctr.appendChild( element )
            dat[a].innerHTML && iterables[tp.ARRAY]( dat[a].innerHTML, element )
            
        }

    }

    const detect = inp => {

        return Array.isArray( inp ) && tp.ARRAY ||
                inp instanceof Function && tp.FUNCTION ||
                inp instanceof Object && tp.OBJECT ||
                tp.STRING

    }

    iterables[detect( doc )]( doc, this.document || this.container)
    //    this.pixy && console.log(this.document)
    this.document && (this.document.busy = false)
    this.pixy && PixyBrowser.render.call( this )
    
}


PixyBrowser.debug = function() {

    Console.showSource( this.document.URL.replace(/\.html/, '.src.html') )

    const recurs = (e, c) => {

        e.childNodes.map( e => {
            
            let node, a, b

            if (e.nodeType === 1) {

                node = document.createElement('div')
                node.className = 'node'

                let ch = document.createElement('div')

                if (e.childNodes.length) {
                    ch.style.cursor = 'pointer'
                    ch.innerHTML = '-'
                    ch.onclick = e => Console.node(e)
                }
                node.appendChild(ch)

                a = document.createElement('div')
                a.onclick = () => Console.info(e)
                b = document.createElement('span')
                b.innerHTML = '&lt;'
                a.appendChild(b)
                b = document.createElement('span')
                b.innerHTML = e.nodeName
                a.appendChild(b)

                if (e.className) {

                    b = document.createElement('span')
                    b.innerHTML = ' class'
                    b.style.color = 'rgb(153,69,0)'
                    a.appendChild(b)
                    b = document.createElement('span')
                    b.innerHTML = '="'
                    b.style.color = 'rgb(168,148,166)'
                    a.appendChild(b)
                    b = document.createElement('span')
                    b.innerHTML = e.className
                    b.style.color = 'rgb(26,26,166)'
                    a.appendChild(b)
                    b = document.createElement('span')
                    b.innerHTML = '"'
                    b.style.color = 'rgb(168,148,166)'
                    a.appendChild(b)

                }

                b = document.createElement('span')
                b.innerHTML = '&gt;'
                a.appendChild(b)
                node.appendChild(a)

                if (e.childNodes.length) {

                    a = document.createElement('div')
                    a.style.display = 'none'
                    a.style.fontSize = '0.6em'
                    a.style.cursor = 'pointer'
                    a.innerHTML = '...'
                    a.onclick = () => Console.info(e)
                    node.appendChild(a)
                    a = document.createElement('div')
                    a.style.display = 'block'
                    a.style.cursor = 'pointer'
                    recurs(e, a)
                    //a.children[0].onclick = () => Console.info(e)
                    node.appendChild(a)
                    a = document.createElement('div')
                    node.appendChild(a)

                } else {

                    a = document.createElement('div')
                    a.style.display = 'none'
                    node.appendChild(a)

                }

                a = document.createElement('div')
                a.onclick = () => Console.info(e)
                b = document.createElement('span')
                b.innerHTML = '&lt;/'
                a.appendChild(b)
                b = document.createElement('span')
                b.innerHTML = e.nodeName
                a.appendChild(b)
                b = document.createElement('span')
                b.innerHTML = '&gt;'
                a.appendChild(b)
                node.appendChild(a)


            } else if (e.nodeType === 3) {

                node = document.createElement('div')
                node.className = 'node'
                a = document.createElement('span')
                a.onclick = () => Console.info(e.parentElement)
                a.innerHTML = '"' + e.data.replace(/(?:\r\n|\r|\n)/g, '<br>') + '"'
                node.appendChild(a)

            }

            c.appendChild(node)

        })
        
    }

    let container = document.getElementById('console').children[0],
        child = container.lastElementChild

    while ( child ) {

        container.removeChild( child )
        child = container.lastElementChild
    } 

    recurs( this.document, container )

}


PixyBrowser.initPixy = function( opt ) {
//PixyBrowser.loadFileAsync('http://0.0.0.0:8000/noun_bluetooth\ off_482384.json').then(a=>console.log(PixyBrowser.dataToString(0,0,JSON.parse(a),{t:0,l:0,b:240,r:191})))
    const { container, url } = opt

    this.pixy = { initialized: false }

    let baseURI

    if ( url.startsWith( 'http' ) ) {
    
        const pathArray = url.split( '/' )

        baseURI = pathArray[0] + '//' + pathArray[2]

    } else

        baseURI = document.baseURI

    baseURI = baseURI.split('?')[0]

    this.document = {
        
        URL: url,
        baseURI: baseURI,

        pixilate : ( left, top, data ) => {

            if ( isNode ) {
                
                this.servers.map( ( a, b ) => a.connected && a.server.isOpen && PixyBrowser.serverWrite.call( this, PixyBrowser.dataToString.call( this, left, top, data, a.crop ), b ) )

            } else if ( this.type === 'matrix' ) {

                let v = this.screen,
                    h = this.window.screen.height,
                    w = this.window.screen.width

                for ( let color in data )

                    for ( let y in data[color] )

                        ( y / 1 + top < h ) && data[color][y].map( x => ( x + left < w ) && ( v[y / 1 + top][x + left].style.backgroundColor = color ) )

            } else {

                let canvas = this.container.children[0].getContext('2d'),
                    px = this.zoomLevel

                canvas.globalAlpha = 1

                for ( let a in data )

                    for ( let b in data[a] ) {

                        let y1 = (b/1) + top
                        this.bitmap[y1] = this.bitmap[y1] || {}
             
                        for ( let c = 0, d = data[a][b].length; c < d; c += 1 ) {
                            
                            canvas.fillStyle = a
                            canvas.fillRect(data[a][b][c] * px + left*px , px * b + top*px, px, px)
                            this.bitmap[y1][data[a][b][c]+left] = a

                        }

                    }
                
            }

        },
        
        styleSheets:{},
        children:[],
        childNodes:[]

    }

    this.document.appendChild = PixyBrowser.appendChild.bind(this.document)
    this.document.getElementById = PixyBrowser.getElementById.bind(this.document)

    if ( isNode ) {

        this.window.addEventListener = function(event, callback) {

            if (event == 'load') {

                this.windowOnLoad = callback
            }

        }.bind(this)

        this.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
        this.setTimeout = setTimeout
        this.clearTimeout = clearTimeout

    } else {

        this.container = container

        let child = container.lastElementChild

        while ( child ) { 

            container.removeChild(child)
            child = container.lastElementChild

        }

        if ( this.type === 'matrix' ) {

            this.screen = {}

            let h = this.window.screen.height,
                w = this.window.screen.width
            
            for ( let a = 0; a < h; a += 1 ) {

                let y = document.createElement( 'div' )

                this.screen[a] = []

                for ( let b = 0; b < w; b += 1 ) 

                    y.appendChild( this.screen[a][b] = document.createElement( 'div' ) )

                container.appendChild( y )

            }

            container.className = 'screen'

        } else {

            let canvas = document.createElement('canvas')

            canvas.width = this.window.screen.width * this.zoomLevel
            canvas.height = this.window.screen.height * this.zoomLevel

            container.style.width = ( this.window.screen.width * this.zoomLevel ) + 'px'
            container.style.height = ( this.window.screen.height * this.zoomLevel ) + 'px'
            
            this.container.appendChild(canvas)

        }


        container.onclick = function( event ) {

            let e = event.target,
                x = 0,
                y = 0
            
            while ( e.previousSibling ) {
        
                x += 1
                e = e.previousSibling
        
            }
        
            e = event.target.parentElement
        
            while ( e.previousSibling ) {
        
                y += 1
                e = e.previousSibling
        
            }
        
            PixyBrowser.mouseEvent.call( this, x, y )
        
        }.bind(this)

    }

}


PixyBrowser.load = function( data, callback ) {

    PixyBrowser.build.call( this, PixyBrowser.parse.call( this, data ) )
    callback && callback.call( this )

    if ( !isNode ) {

        const evt = document.createEvent('Event')
        evt.initEvent('load', false, false)
        window.dispatchEvent(evt)

    }

}

PixyBrowser.mouseEvent = function( x, y ) {

    let dom

    const recurs = element => {

        for ( let a = 0, an = ( element.childNodes || [] ).length; a < an; a += 1 ) {

            let e = element.childNodes[a]

            if ( e.offsetLeft <= x && ( e.offsetLeft + e.offsetWidth ) >= x && e.offsetTop <= y && ( e.offsetTop + e.offsetHeight )  >= y )// {

                dom = e
                
            
            recurs( e )

        }

    }

    recurs(this.document)

    if ( dom && dom.onclick )
    
        if ( isNode ) {

            try {
                console.log(dom.onclick)
                vm.run( dom.onclick )

            } catch(e) { console.log('VM Event Error:' + e) }

        } else

            dom.onclick()

    return dom

}

PixyBrowser.zoom = function( z ) {

    this.zoomLevel = z

    if ( this.type === 'matrix' ) {

        let style = document.createElement('style');            
        style.type = 'text/css';
        style.innerHTML = '.screen > div > div { height:' + z + 'px;width:' + z + 'px; }'
        document.getElementsByTagName('head')[0].appendChild(style)

    } else {
        
        this.container.style.width = ( this.window.screen.width * this.zoomLevel ) + 'px'
        this.container.style.height = ( this.window.screen.height * this.zoomLevel ) + 'px'
        this.container.children[0].width = ( this.window.screen.width * this.zoomLevel )
        this.container.children[0].height = ( this.window.screen.height * this.zoomLevel )

        let bmp = {}

        for (let y in this.bitmap)

            for (let x in this.bitmap[y]) {

                bmp[this.bitmap[y][x]] = bmp[this.bitmap[y][x]] || {}
                !( bmp[this.bitmap[y][x]][y] = bmp[this.bitmap[y][x]][y] || [] ).push( x/1 )

            }

        this.document.pixilate(0,0,bmp)
   
    }


}

/* ###############

   BLUETOOTH SERVER METHODS

 ############### */

PixyBrowser.serverRun = function(opt) {

    global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
    global.fetch = require('node-fetch')

    this.opt = opt
    this.servers = []

    const h = this.window.screen.height,
        w = this.window.screen.width

    this.dimensions = 'DIMENSION:' + w + ',' + h + ';'
    let dimArray = []
    const devices = opt.devices || [{top:0, left: 0, bottom: h, right: w}]

    for ( let a = 0, an = devices.length ; a < an; a += 1)

        dimArray.push(( devices[a].top || 0 ) + ',' + ( devices[a].left || 0 ) + ',' + ( devices[a].bottom || h ) + ',' + ( devices[a].right || w ))
    
    this.dimensions += dimArray.join(';') + '\n'

    for (let a = 0, an = opt.devices.length || 1; a < an; a += 1)

        this.servers.push( PixyBrowser.serverAdd.call( this, a, this.dimensions ) )

    if ( this.consoleOn ) {
        
        const http = require('http');

        const requestListener = function (req, res) {
            res.writeHead(200);
            res.end('CONSOLE TEST');
            console.log(req.url)
        }

        http.createServer(requestListener).listen(8080)

    }

}


PixyBrowser.serverAdd = function( num ) {

    const
        UUID = '00001101-0000-1000-8000-00805F9B34FB'

    const server = new(require('bluetooth-serial-port')).BluetoothSerialPortServer()

    server.on('data', function( buffer ) {

        const
            incoming = buffer.toString().trim(),
            commands = incoming.split( '\n' )

        console.log('IN #' + num + ': ' + incoming)

        commands.map( incoming => {
                
            if ( incoming.startsWith( 'CONNECT' ) ) {

                const crop = ( incoming.split( ':' )[1] || '0,0,0,0' ).split(',').map( a => parseInt( a, 10 ) )

                this.servers[num].connected = true
                this.servers[num].crop = {

                    t: crop[0],
                    l: crop[1],
                    b: crop[2],
                    r: crop[3]

                }

                if (!this.pixy.initialized) {

                    const {VM} = require('vm2')
                    
                    this.pixy.initialized = true
                    
                    PixyBrowser.loadFileAsync( this.document.URL ).then( data => PixyBrowser.load.call( this, data ) )

                    global.vm = new VM( {sandbox: this} )

                    this.consoleOn && vm.run('var console = new (function() {' +
                        'this.log = function(arg) {' +
                        'var req = new XMLHttpRequest();' +
                        'req.open("GET", "http://localhost:8080?data="+arg);'+
                        'req.send();}})();')
        
                } else {

                    let bmp = {}

                    for (let y in this.bitmap)

                        for (let x in this.bitmap[y]) {

                            bmp[this.bitmap[y][x]] = bmp[this.bitmap[y][x]] || {}
                            !( bmp[this.bitmap[y][x]][y] = bmp[this.bitmap[y][x]][y] || [] ).push( x )

                        }

                    PixyBrowser.serverWrite.call( this, PixyBrowser.dataToString( 0, 0, bmp, this.servers[num].crop ), num )
                
                }

            } else if ( incoming.startsWith( 'CLICK' ) )

                PixyBrowser.mouseEvent.apply( this, incoming.split( ':' )[1].split( ',' ) )

            else if ( incoming.startsWith( 'INIT' ) )

                PixyBrowser.serverWrite.call( this, this.dimensions, num )

            else if ( incoming.startsWith( 'DISCONNECT' ) || incoming.startsWith( 'CLOSE' ))

                this.servers[num].connected = false


        })
        
    }.bind( this ) )

    server.on('disconnected', ()=>console.log('DISCONNECT:',num))
    server.on('closed', ()=>console.log('CLOSE:',num))
    server.on('failure', (e)=>console.log('FAIL:',num,e))

    server.listen(function (clientAddress) {
        console.log('CONNECTED #' + num + ' MAC ' + clientAddress);
    }, function(error){
        console.error('Server ' + num + ' error:' + error);
    }, {uuid: UUID, channel: num + 1 });


    return {

        server:server,
        connected: false

    }

}


PixyBrowser.serverReset = function( num ) {

    this.servers[num].connected = false
    this.servers[num].server.disconnectClient()
    this.servers[num].server.close()    
    this.servers[num] = PixyBrowser.serverAdd.call( this, num )
    console.log( 'SERVER RESET: ' + num )

}

PixyBrowser.serverWrite = function( data, num ) {
    
    console.log('OUT #' + num + ': ' + Math.round(data.length/1024) + 'K')

    try {

/*
const fs = require('fs')
fs.writeFile("test.txt", data,  "binary",function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
});
*/

        this.servers[num].server.write(Buffer.from(data, 'ascii'), e => {

            if ( e )

                PixyBrowser.serverReset.call( this, num )
        
        } )
    

    } catch( e ) {

        PixyBrowser.serverReset.call( this, num )

    }

}


/* ###############

   BROWSER DOM METHODS

 ############### */


PixyBrowser.appendChild = function( e ) {

    let o = this                                                         

    e.parentElement = o
    e.previousChild = o.children[o.children.length - 1]
    e.previousSibling = o.childNodes[o.childNodes.length - 1]

    if ( e.nodeType === 1 ) 

        o.children.push(e)

    else if ( e.nodeType === 3 )

        o.innerHTML = e.data 

    o.childNodes.push(e)

    const recurs = e => {

        let pint = i => parseInt(i, 10) || 0,
            p = e.parentElement

        while ( p ) {

            let c = p.css

            if ( p.nodeName && PixyBrowser[PixyBrowser.sym[p.nodeName]].offset ) {

                if ( p.offsetTop + p.offsetHeight - pint(c.borderBottomWidth) - pint(c.paddingBottom) < e.offsetTop + e.offsetHeight )

                    p.offsetHeight = pint(c.borderBottomWidth) + pint(c.paddingBottom) + e.offsetTop + e.offsetHeight - p.offsetTop

                if ( p.offsetLeft + p.offsetWidth - pint(c.borderRightWidth) - pint(c.paddingTop) < e.offsetLeft + e.offsetWidth )

                    p.offsetWidth = pint(c.borderRightWidth) + pint(c.paddingRight) + e.offsetLeft + e.offsetWidth - p.offsetLeft

            }

            p = p.parentElement

        }     

    }

    const n = PixyBrowser.sym[e.nodeName]

    if (PixyBrowser[n].offset) {

        PixyBrowser[n].offset.call( this, e )

        if (e.nodeType === 1)

            recurs(e)

        else if (e.nodeType === 3 && PixyBrowser[PixyBrowser.sym[e.parentElement.nodeName]].offset )

            recurs(e.parentElement)

    }

}
                             

PixyBrowser.createElement = function( t ) {

    const tagName = t.toUpperCase(),
            tag = PixyBrowser[PixyBrowser.sym[tagName]]

    let o = { css:{} }
    
    o.appendChild = PixyBrowser.appendChild.bind(o)
    o.children = []
    o.childNodes = []
    o.clientHeight = 0
    o.clientLeft = 0
    o.clientTop = 0
    o.clientWidth = 0
    o.id = ''
    o.nodeName = tagName
    o.nodeType = 1
    o.offsetHeight = 0
    o.offsetLeft = 0
    o.offsetParent = null
    o.offsetTop = 0
    o.offsetWidth = 0
    o.ownerDocument = this.document
    o.parentElement = null
    o.previousSibling = null
    o.tagName = tagName


    if ( !tag )

        return o

    const wrap = fn => {

        return ( () => {

            return ( function ( that, fn ) {

                return ( a => fn.call( that, a ) )

            } )( o, fn )

        } ).call( this )

    }

    if ( tag && tag.watch ) {

        o._watch = o._watch || {}

        Object.defineProperty( o, 'watch', {

            value: ( prop, set, get ) => {
                
                Object.defineProperty( o, prop, {

                    set: val => { return val = set( val ) },
                    get: get
                    
                })

            }

        })

        tag.watch.map( n => {

            o.watch( PixyBrowser.watch[n].name || n, wrap( PixyBrowser.watch[n].set ), wrap( PixyBrowser.watch[n].get ) )

        })

    }

    for ( let n in tag.methods )

        o[n] = wrap( tag.methods[n] )

    return o

}


PixyBrowser.createTextNode = function ( txt ) {
  
  let o = {}
  
  o.data = txt
  o.nodeName = '#text'
  o.nodeType = 3
  o.parentElement = null

  o.txtwidth = () => {

      let c = o.parentElement.css,
          f = PixyBrowser.font( c.fontFamily || 'pixel' ),
          spc = c.letterSpacing || f.spacing || 2,
          chr = f.char,
          w = 0        

      ! ( txt.split( '' ) ).map( a => {

            if(!chr[a])return
  
            w += chr[a].w + spc
  
      } )

      return w
  
  }

  return o

}


PixyBrowser.getElementById = function ( id ) {

    let dom

    const recurs = element => {

        if ( dom )

            return

        for ( let a = 0, an = ( element.childNodes || [] ).length; a < an; a += 1 ) {

            let e = element.childNodes[a]
            
            if ( e.id === id ) {

                dom = e
                break

            } else
            
                recurs( e )

        }

    }
    
    recurs(this)
    
    return dom

}


/* ###############

   WEB PAGE VIEW RENDERER

 ############### */


PixyBrowser.render = function() {

  const recurs = e => {
      
      if ( PixyBrowser.sym[e.nodeName] && PixyBrowser[PixyBrowser.sym[e.nodeName]].offset ) {

          if ( e.nodeType === 1 ) {

              PixyBrowser.renderBackground.call( this, e )
              PixyBrowser.renderBorder.call( this, e )

          } else if ( e.nodeType = 3 ) {

              const
                   pint = i => parseInt(i, 10) || 0,
                   p = e.parentElement,
                   c = p.css,
                   s = e.previousSibling,
                   t = PixyBrowser[PixyBrowser.sym[p.nodeName]]

              if ( t.offset ) {

                  let l = (s ? s.offsetLeft + s.offsetWidth : p.offsetLeft) + pint(c.paddingLeft),// + pint(c.borderLeftWidth),
                      t = p.offsetTop + pint(c.paddingTop)// + pint(c.borderTopWidth)
                                       
                      e.data && p.ownerDocument.pixilate( l, t, PixyBrowser.renderText( e.data, c.color, c.fontFamily, c.letterSpacing ) )

              }
          }

      }

      !( e.childNodes || [] ).map( e => recurs( e ) )                
              
  }

  recurs( this.document )

      this.windowOnLoad && this.windowOnLoad()

}


PixyBrowser.renderBackground = function ( e ) {

  const
      c = e.css || {},
      col = c.backgroundColor,
      h = e.offsetHeight,
      w = e.offsetWidth

  let data = {}
  
  if ( col )

      for ( let a = 0; a < h; a += 1 )

          for ( let b = 0; b < w; b += 1 )

              ( data[a] = data[a] || [] ).push( b )

  else
      return

  this.document.pixilate( e.offsetLeft, e.offsetTop, { [col]: data } )

}

PixyBrowser.renderBorder = function ( e ) {

  const
      c = e.css || {},
      h = e.offsetHeight,
      w = e.offsetWidth,
      sides = {
          Bottom: { x0: 0, x1: w, y: h - 1 },
          Top: { x0: 0, x1: w, y: 0 },
          Right: { y0: 0, y1: h, x: w - 1 },
          Left: {  y0: 0, y1: h, x: 0 }
      }

  let data = {}

  for ( let s in sides ) {

      const
          col = c['border' + s + 'Color'],
          wdt = parseInt(c['border' + s + 'Width'], 10) || 0,
          sd = sides[s]

      data = {}

      for ( let a = 0; a < wdt; a += 1 )

          for ( let b = sd.x0 || sd.y0 || 0, bn = sd.x1 || sd.y1; b < bn; b += 1 ) {

              if ('x' in sd) ( data[b] = [sd.x] )
              if ('y' in sd) ( data[sd.y] = data[sd.y] || [] ).push( b )

          }

      wdt && this.document.pixilate( e.offsetLeft, e.offsetTop, { [col]: data } )

  }

}

PixyBrowser.renderText = function ( txt, col, fnt, ls ) {

  const f = PixyBrowser.font( fnt || 'pixel' )

  let data = {},
      l = 0

  const 
      pad = 1,
      spc = ls || f.spacing || 2,
      chr = f.char

  ! ( txt.split( '' ) ).map( a => {

      if(!chr[a])return

      for ( let b in chr[a] && chr[a].map || {} )

          chr[a].map[b].map( px => ( data[b / 1 + pad] = data[b / 1 + pad] || [] ).push ( px + pad + l ) )

      l += chr[a].w + spc
      
  } )

  return {[col || '#0f0']: data}

}


PixyBrowser.cssPropMap = {
  cssjs: {
      class: 'className',
      colspan: 'colSpan'
  },
  jscss: {
      className: 'class',
      colSpan: 'colspan'
  }
}


PixyBrowser.loadFileAsync = async url => await (await fetch(url + '?rnd=' + Math.random())).text()


PixyBrowser.parse = function( data ) {

  data = data.trim()

  const prop = tag => {

      let o = {}

      for (let a = 0, an = tag.length; a < an; a += 1) {

          let eq = tag.indexOf('=', a),
              prop = tag.substring(a, eq),
              val = tag.substr(eq + 1).match(/"(?:[^"\\]|\\.)*"/)[0],
              v = val.replace(/^"|"$/g, '').trim()

          a += prop.length + val.length + 1
          prop = prop.trim()

          if (prop.startsWith('on'))

              if ( !isNode )
              
                v = new Function("return () => " + v).call(this)

          o[PixyBrowser.cssPropMap.cssjs[prop] || prop] = v

      }

      return o

  }

  const tagend = ( data, tagName ) => {

      const
          regopen = new RegExp('<' + tagName, 'gi'),
          regclose = new RegExp('<\/' + tagName + '>', 'gi'),
          rclose = regclose.exec(data)
                
      let point = rclose && rclose.index || 0

      if ( rclose && !~point )

          return data.indexOf( '>' )

      while ( ~point ) {

          let str = data.substring( 0, point )

          if ( (str.match(regopen) || []).length === (str.match(regclose) || []).length + 1 )

              return point

          str = data.substr( point + 1)
          point += regclose.exec( str ).index + 1

      }

  }

  const iterate = data => {

      let js = [],
          test = true,
          pt = 0,
          str = data.trim()

      while ( test ) {

          let to = str.indexOf( '<' )

          if ( ~to ) {

              let txt = str.substr( 0, to ).trim()
              txt && js.push( txt )

              str = str.substr( to )

              let tag = str.substring( 1, str.indexOf('>')),
                  tagName = tag.split(/\s/)[0].toUpperCase(),
                  te = tagend( str, tagName ),
                  p = prop(tag.substring(tagName.length, str.indexOf('>')).trim()),
                  o = { [ tagName ]: {prop:p} }

              pt += to + 1 + str.indexOf( '>', te )

              let htm = str.substring( str.indexOf( '>' ) + 1, te ).trim()

              if ( htm )

                  o[tagName].innerHTML = tagName !== 'SCRIPT' ? iterate( htm ) : [htm]

              js.push( o )

          } else {

              let txt = str.trim()
              txt && js.push( txt )
              test = false

          }

          str = data.substr(pt)

      }

      return js

  }

  return iterate( data )
         
}


PixyBrowser.dataToString = function( left, top, data, crop ) {

    data ={'#ff2233':{99:[1,2,3,4,5,6,7,8,9,10],98:[1,2,3,4,5,6,7,8,9,10],97:[1,2,3,4,5,6,7,8,9,10]},
        
        '#ffffff':{//100:[1,2,3,4,5,6,7,8,9,10],
        100:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
        101:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
        102:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
        //102:[1,2,3,4,5,6,7,8,9,10],
        //103:[1,2,3,4,5,6,7,8,9,10]
        }}
    let r,g,b, out = ''

    const bin = i => { return String.fromCharCode(Math.floor( i / 256 )) + String.fromCharCode(( i % 256 )) }

    console.log(bin(1024))
    this.bitmap = this.bitmap || {}

    for ( let color in data ) {

        if (color.startsWith('#')) {

            let c = color.replace(/\#/,'').toUpperCase()

            if (c.length == 3){
                
                r = c.charAt(0)+'0'
                g = c.charAt(1)+'0'
                b = c.charAt(2)+'0'

            } else {

                r = c.substr(0,2)
                g = c.substr(2,2)
                b = c.substr(4,2)

            }

            r = parseInt(r, 16) << 8 / 256
            g = parseInt(g, 16) << 8 / 256
            b = parseInt(b, 16) << 8 / 256

        } else if (color.startsWith('rgb')) {

            let c = color.replace(/rgb|\(|\)/g,'').split(',')
            
            r = c[0]/1
            g = c[1]/1
            b = c[2]/1

        }

        let yin = false

        for ( let y in data[color] ) {

            let y1 = y / 1 + top
            this.bitmap[y1] = this.bitmap[y1] || {}

            if ( crop.t <= y1 && crop.b >= y1 ) {

                let inrange = false

                data[color][y].map( a => {

                    let x1 = a/1 + left
                    this.bitmap[y1][x1] = color

                    if ( crop.l <= x1 && crop.r >= x1 ) {

                        if ( !yin ) {

                            if (out.length) out+=String.fromCharCode( 255 ) + String.fromCharCode( 254 )
                             
                            out += String.fromCharCode( r === 255 ? 1 : 0 ) + String.fromCharCode( r === 255 ? 254 : r ) +
                                String.fromCharCode( g === 255 ? 1 : 0 ) + String.fromCharCode( g === 255 ? 254 : g ) +
                                String.fromCharCode( b === 255 ? 1 : 0 ) + String.fromCharCode( b === 255 ? 254 : b )

                        }

                        yin = true
                        !inrange && ( out += bin( y1 ) )
                        out += bin( x1 )
                        inrange = true

                    }

                } )
            
            }

        }

        yin && ( out += String.fromCharCode( 255 )  + String.fromCharCode( 255 ) )
    
    }
  
    return out
      
}

PixyBrowser.dataToString = function( left, top, data, crop ) {

    let r,g,b,cArr=[]

    this.bitmap = this.bitmap || {}

    for ( let color in data ) {

        if (color.startsWith('#')) {

            let c = color.replace(/\#/,'').toUpperCase()

            if (c.length == 3){
                
                r = c.charAt(0)+'0'
                g = c.charAt(1)+'0'
                b = c.charAt(2)+'0'

            } else {

                r = c.substr(0,2)
                g = c.substr(2,2)
                b = c.substr(4,2)

            }

            r = parseInt(r, 16) << 8 /256
            g = parseInt(g, 16) << 8 /256
            b = parseInt(b, 16) << 8 /256

        } else if (color.startsWith('rgb')) {

            let c = color.replace(/rgb|\(|\)/g,'').split(',')
            
            r = c[0]/1
            g = c[1]/1
            b = c[2]/1

        }

        let line = []

        for ( let y in data[color] ) {

            let y1 = y / 1 + top
        
            this.bitmap[y1] = this.bitmap[y1] || {}

            if ( crop.t <= y1 && crop.b >= y1 ) {
                    
                let tmp = []
                
                data[color][y].map( a => {

                    let x1 = a/1 + left
                    this.bitmap[y1][x1] = color
                    crop.l <= x1 && crop.r >= x1 && tmp.push( x1 )

                } )

                !(tmp.length && line.push( y1 + ':' + tmp.join(',')))

            }

        }

        line.length && cArr.push(r+'/'+g+'/'+b+' '+line.join(';'))
    
    }
  //console.log(cArr.length)

    return cArr.length ? cArr.join('\n') + '\n' : ''
  
}

/* ###############

   HTML TAG SYMBOLS

 ############### */


PixyBrowser.sym = {
  '#text': Symbol('#text'),
  BODY: Symbol('body'),
  CANVAS: Symbol('canvas'),
  DIV: Symbol('div'),
  HEAD: Symbol('head'),
  HTML: Symbol('html'),
  IMG: Symbol('img'),
  LINK: Symbol('link'),
  SCRIPT: Symbol('script'),
  STYLE: Symbol('style')
}


PixyBrowser[PixyBrowser.sym['#text']] = {

  offset: e => {

      const
          pint = i => parseInt(i, 10) || 0,
          p = e.parentElement,
          c = p.css,
          f = PixyBrowser.font(c.fontFamily || 'pixel'),
          h = p.clientHeight - pint(c.paddingBottom) - pint(c.paddingTop),//pint(c.height),
          w = pint(c.width)

      if ( !PixyBrowser[PixyBrowser.sym[p.nodeName]].offset )

          return      

      if ( !h ) {

          p.offsetHeight += f.h 
          p.clientHeight += f.h
      }

      if ( !w ) 

          p.offsetWidth += e.txtwidth()
          

  }

}

PixyBrowser[PixyBrowser.sym.BODY] = {

  offset: e => {

      const p = e.parentElement
      e.offsetTop = p.offsetTop || 0
      e.offsetLeft = p.offsetLeft || 0
      e.offsetHeight = p.offsetHeight || 0
      e.offsetWidth = p.offsetWidth || 0

  },

  watch: ['innerHTML','className']

}


PixyBrowser[PixyBrowser.sym.CANVAS] = {

  offset: e => {

      const
          pint = i => parseInt(i, 10) || 0,
          p = e.parentElement,
          c = p.css,
          s = e.previousSibling

      e.offsetTop = (s ? s.offsetTop + s.offsetHeight : p.offsetTop) + pint(c.paddingTop)
      e.offsetLeft = p.offsetLeft + pint(c.paddingLeft)
      e.offsetHeight = parseInt( e.height || 0, 10 )
      e.offsetWidth = parseInt( e.width || 0, 10 )
      
  },

  methods: {
      
      render: function(o) {

          this.ownerDocument.pixilate( this.offsetLeft, this.offsetTop, o )

      }
  
  }

}


PixyBrowser[PixyBrowser.sym.DIV] = {

  offset: element => {

      const
          pint = i => parseInt(i, 10) || 0,
          c = element.css,
          e = element,
          ed = c.display || 'block',
          f = PixyBrowser.font(c.fontFamily || 'pixel')

      e.clientHeight = pint(c.height) + pint(c.paddingBottom) + pint(c.paddingTop)
      e.clientLeft = pint(c.borderLeftWidth)
      e.clientTop = pint(c.borderTopWidth)
      e.clientWidth = pint(c.width) + pint(c.paddingLeft) + pint(c.paddingRight)
      e.offsetHeight = pint(c.height) + pint(c.borderBottomWidth) + pint(c.borderTopWidth) + pint(c.paddingBottom) + pint(c.paddingTop)
      e.offsetLeft = 0
      e.offsetParent = null
      e.offsetTop = 0
      e.offsetWidth = pint(c.width) + pint(c.borderLeftWidth) + pint(c.borderRightWidth) + pint(c.paddingLeft) + pint(c.paddingRight)

      let p = e.parentElement,
          pc = p.css,
          s = e.previousSibling,
          sc = s && s.css || {},
          sd = sc.display || 'block'

      if ( s ) {

          if ( s.nodeType === 1 ) {

              if ( ed === 'block' || sd === 'block' ) {

                  e.offsetLeft = p.offsetLeft + pint(c.marginLeft) + pint(pc.borderLeftWidth) + pint(pc.paddingLeft)
                  e.offsetTop = s.offsetHeight + s.offsetTop + pint(sc.marginBottom) + pint(c.marginTop)

              } else if ( ed === 'inline-block' ) {

                  e.offsetLeft = s.offsetLeft + s.offsetWidth + pint(c.marginLeft) + pint(sc.marginRight)
                  e.offsetTop = s.offsetTop + pint(c.marginTop)

              }

          } else if ( s.nodeType === 3 ) {

              e.offsetLeft += s.txtwidth() + (s.previousSibling && (s.previousSibling.offsetLeft + s.previousSibling.offsetWidth) || 0)

          }

      } else {

          e.offsetLeft = p.offsetLeft + pint(c.marginLeft) + pint(pc.borderLeftWidth) + pint(pc.paddingLeft)
          e.offsetTop = p.offsetTop + pint(c.marginTop) + pint(pc.borderTopWidth) + pint(pc.paddingTop)

      }    

  },

  watch: ['className','innerHTML']

}

PixyBrowser[PixyBrowser.sym.HTML] = {

  offset: e => {

  },

  watch: ['innerHTML']

}

PixyBrowser[PixyBrowser.sym.HEAD] = {}


PixyBrowser[PixyBrowser.sym.IMG] = {

    offset: e => {

        const
            pint = i => parseInt(i, 10) || 0,
            p = e.parentElement,
            c = p.css,
            s = e.previousSibling
  
        e.offsetTop = (s ? s.offsetTop + s.offsetHeight : p.offsetTop) + pint(c.paddingTop)
        e.offsetLeft = p.offsetLeft + pint(c.paddingLeft)
        e.offsetHeight = parseInt( e.height || 0, 10 )
        e.offsetWidth = parseInt( e.width || 0, 10 )

    },
  
    watch: ['imgSRC']

}

PixyBrowser[PixyBrowser.sym.LINK] = {

//    watch: ['href']
                                                                             
}


PixyBrowser[PixyBrowser.sym.SCRIPT] = {

    watch: ['src','scriptInnerHTML']
  
}

PixyBrowser[PixyBrowser.sym.STYLE] = {

 watch: ['styleInnerHTML']

}



/* ###############

   DOM ELEMENT PROPERTIES CHANGE WATCH

 ############### */



PixyBrowser.watch = {}

PixyBrowser.watch.className = {

    set: function( a ) {

        const
            e = this,
            c = e.css,
            pint = i => parseInt(i, 10) || 0,
            l = this.offsetLeft + pint(c.paddingLeft),
            t = this.offsetTop + pint(c.paddingTop),
            sides = ['bottom','left','right','top'],
            bp = ['width', 'style', 'color'],
            camel = a => a.toLowerCase().replace( /-([a-z])/g, a =>  a[1].toUpperCase() )

        e._watch.className = a
        
        const slctr = {

            '-1': ( k, v ) => c[camel( k.join( '-' ) )] = v,

            0: ( k, v ) => {

                const
                    side = k[1],
                    val = v.split( /\s+/ ),
                    ar = side && [side] || sides

                if ( k.length === 3 )

                    c[camel( k.join( '-' ) )] = v

                else if ( k.length === 2 )

                    bp.map( ( a, b ) => {

                        let key = camel( [k[0], side, a].join( '-' ) )
                        delete c[key]
                        
                        val[b] && ( c[key] = val[b] )
                    } )
                    
                else
                
                    ar.map( s => {

                        bp.map( ( a, b ) => {

                            let key = camel( [k[0], s, a].join( '-' ) )
                            delete c[key]
                            
                            val[b] && ( c[key] = val[b] )
                        } )

                    })

            },

            1: ( k, v ) => {

                const
                    side = k[1],
                    val = v.split( /\s+/ )

                if ( k.length === 2 )

                    c[camel( k.join( '-' ) )] = v

                else

                    sides.filter( a => !side || a === side ).map( s => {

                        let key = camel( [k[0], s].join( '-' ) )

                        c[key] = v

                    })

            },

            2: ( k, v ) => slctr[1]( k, v )

        }

        a.split(/\s+/).map( a => {

            for ( let [k, v] of this.ownerDocument.styleSheets[a] || [] ) {

                k = k.split('-')
                slctr[['border','padding','margin'].indexOf( k[0] )]( k, v )
            }
            
        })

        !e.ownerDocument.busy && e.ownerDocument.pixilate( l, t, PixyBrowser.renderBackground.call( {document:this.ownerDocument}, e ) )
        !e.ownerDocument.busy && e.ownerDocument.pixilate( l, t, PixyBrowser.renderText.call( {document:this.ownerDocument}, e._watch.innerHTML, e.css.color, e.css.fontFamily, e.css.letterSpacing ) )
        !e.ownerDocument.busy && e.ownerDocument.pixilate( l, t, PixyBrowser.renderBorder.call( {document:this.ownerDocument}, e ) )
        
    },

    get: function () {

        return this._watch.className

    }

}

PixyBrowser.watch.innerHTML = {

  set: function ( txt ) {

      if(!this.ownerDocument.busy) {

         const pint = i => parseInt(i, 10) || 0,
               c = this.css,
               l = this.offsetLeft + pint(c.paddingLeft),
               t = this.offsetTop + pint(c.paddingTop),
               bkg = c.backgroundColor || 'transparent',
               col = c.color,
               f = c.fontFamily,
               ls = c.letterSpacing,
               old = this._watch.innerHTML

         old && this.ownerDocument.pixilate( l, t, PixyBrowser.renderText( old, bkg , f, ls ) )
         this.ownerDocument.pixilate( l, t, PixyBrowser.renderText( txt, col, f, ls ) )

      }

      this._watch.innerHTML = txt

  },

  get: function () {

      return this._watch.innerHTML || ''

  }
}


PixyBrowser.watch.imgSRC = {

    name: 'src',
  
    set: function ( src ) {

        if ( !src.startsWith('http') )

            src = this.ownerDocument.baseURI + src.replace(/^\./, '')
            
        PixyBrowser.loadFileAsync.call( this, src ).then( data => {

            const pint = i => parseInt(i, 10) || 0,
            c = this.css,
            l = this.offsetLeft + pint(c.paddingLeft),
            t = this.offsetTop + pint(c.paddingTop)

            let img = JSON.parse( data )
            this.ownerDocument.pixilate( l, t, img )
                        
        } )

        this._watch.src = src

    },

    get: function () {
  
        return this._watch.src || ''
  
    }

}
  


PixyBrowser.watch.scriptInnerHTML = {

    name: 'innerHTML',

    set: function ( txt ) {

        const e = this

        if ( isNode ) {

            try {
                
                vm.run( txt )

            } catch(e) { console.log('VM Error' + e) }

        } else {

            let script = document.createElement('script')
            script.name = 'pixyjsscript'
            script.className = 'pixyjsscript'
            script.innerHTML = txt
            e._watch.innerHTML = txt
            document.head.appendChild(script)

        }

    },

  get: function () {

      return this._watch.innerHTML || ''

  }
}

PixyBrowser.watch.styleInnerHTML = {

  name: 'innerHTML',

  set: function ( css ) {

      const e = this

      e._watch.innerHTML = css

      css.split('}').map( a => a.trim() ).filter( a => a ).map( a => {

                      let m = new Map()
                      a.split('{')[1].split(';').map( a => { return a.trim() }).filter( a=>a ).map(a=>{

                          let b=a.split(':')
                          m.set(b[0].trim(), b[1].trim() )

                      })
                      this.ownerDocument.styleSheets[a.match(/\.(.*){/).pop().trim()] = m
                  })

  },

  get: function () {

      return this._watch.innerHTML || ''

  }
}

PixyBrowser.watch.src = {

  set: function ( src ) {

      const e = this

      let script = document.createElement( e.tagName )

      script.type = 'text/javascript'
      script.src = src + '?rnd=' + Math.random()
      document.getElementsByTagName('head')[0].appendChild( script )

  },

  get: function () {

      return this._watch.src

  }
}


PixyBrowser.watch.href = {
            
  set: function ( href ) {
  },

  get: function () {

      return this._watch.href

  }
}



/* ###############

   FONTS

 ############### */


PixyBrowser.font = fnt => {


  let f = PixyBrowser.fonts[fnt || 'pixel'],
      data = { h: f.h, char: {} }

  for (let a in f.char)

      data.char[a] = {
          map: f.char[a], w: (a => {
              let w = 0

              for (let b in a)

                  if (w < Math.max.apply(null, a[b])) w = Math.max.apply(null, a[b])

              return w

          })(f.char[a])
      }

  data.char[' '] = { w: f.w, map: {} }

  return data

  
}

PixyBrowser.fonts = {

  pixel: {

      h: 6,
      w: 6,
      char: {

          0: { 0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [0, 3], 4: [0, 3], 5: [1, 2] },
          1: { 0: [1], 1: [0, 1], 2: [1], 3: [1], 4: [1], 5: [0, 1, 2] },
          2: { 0: [1, 2], 1: [0, 3], 2: [2], 3: [1], 4: [0], 5: [0, 1, 2, 3] },
          3: { 0: [0, 1, 2], 1: [3], 2: [1, 2], 3: [3], 4: [3], 5: [0, 1, 2] },
          4: { 0: [0, 3], 1: [0, 3], 2: [0, 3], 3: [0, 1, 2, 3], 4: [3], 5: [3] },
          5: { 0: [0, 1, 2, 3], 1: [0], 2: [0, 1, 2], 3: [3], 4: [3], 5: [0, 1, 2] },
          6: { 0: [1, 2, 3], 1: [0], 2: [0, 1, 2], 3: [0, 3], 4: [0, 3], 5: [1, 2] },
          7: { 0: [0, 1, 2, 3], 1: [3], 2: [3], 3: [3], 4: [3], 5: [3] },
          8: { 0: [1, 2], 1: [0, 3], 2: [1, 2], 3: [0, 3], 4: [0, 3], 5: [1, 2] },
          9: { 0: [0, 1, 2, 3], 1: [0, 3], 2: [0, 1, 2, 3], 3: [3], 4: [3], 5: [3] },
          A: { 0: [1, 2, 3], 1: [0, 4], 2: [0, 1, 2, 3, 4], 3: [0, 4], 4: [0, 4], 5: [0, 4] },
          B: { 0: [0, 1, 2, 3], 1: [0, 4], 2: [0, 1, 2, 3], 3: [0, 4], 4: [0, 4], 5: [0, 1, 2, 3] },
          C: { 0: [1, 2, 3], 1: [0, 4], 2: [0], 3: [0], 4: [0, 4], 5: [1, 2, 3] },
          D: { 0: [0, 1, 2, 3], 1: [0, 4], 2: [0, 4], 3: [0, 4], 4: [0, 4], 5: [0, 1, 2, 3] },
          G: { 0: [1, 2, 3], 1: [0, 4], 2: [0], 3: [0, 3, 4], 4: [0, 4], 5: [1, 2, 3] },
          H: { 0: [0, 4], 1: [0, 4], 2: [0, 1, 2, 3, 4], 3: [0, 4], 4: [0, 4], 5: [0, 4] },
          I: { 0: [0], 1: [0], 2: [0], 3: [0], 4: [0], 5: [0] },
          K: { 0: [0, 3], 1: [0, 2], 2: [0, 1], 3: [0, 2], 4: [0, 3], 5: [0, 3] },
          L: { 0: [0], 1: [0], 2: [0], 3: [0], 4: [0], 5: [0, 1, 2, 3, 4] },
          M: { 0: [0, 4], 1: [0, 1, 3, 4], 2: [0, 2, 4], 3: [0, 4], 4: [0, 4], 5: [0, 4] },
          N: { 0: [0, 4], 1: [0, 1, 4], 2: [0, 2, 4], 3: [0, 3, 4], 4: [0, 3, 4], 5: [0, 4] },
          O: { 0: [1, 2, 3], 1: [0, 4], 2: [0, 4], 3: [0, 4], 4: [0, 4], 5: [1, 2, 3] },
          P: { 0: [0, 1, 2, 3], 1: [0, 4], 2: [0, 1, 2, 3], 3: [0], 4: [0], 5: [0] },
          R: { 0: [0, 1, 2, 3], 1: [0, 4], 2: [0, 1, 2, 3], 3: [0, 4], 4: [0, 4], 5: [0, 4] },
          S: { 0: [1, 2, 3, 4], 1: [0], 2: [1, 2, 3], 3: [4], 4: [4], 5: [0, 1, 2, 3] },
          T: { 0: [0, 1, 2, 3, 4], 1: [2], 2: [2], 3: [2], 4: [2], 5: [2] },
          V: { 0: [0, 4], 1: [0, 4], 2: [0, 4], 3: [1, 3], 4: [1, 3], 5: [2] },
          W: { 0: [0, 4], 1: [0, 4], 2: [0, 2, 4], 3: [0, 2, 4], 4: [0, 2, 4], 5: [1, 3] },
          '.': { 5: [0] },
          '-': { 2: [0, 1] }

      }

  },

  small: {

      h: 10,
      w: 3,
      char: {
          A: { 0: [1, 2, 3], 1: [0, 4], 2: [0, 4], 3: [0, 1, 2, 3, 4], 4: [0, 4], 5: [0, 4], 6: [0, 4] },
          B: { 0: [0, 1, 2, 3], 1: [0, 3], 2: [0, 3], 3: [0, 1, 2, 3, 4], 4: [0, 4], 5: [0, 4], 6: [0, 1, 2, 3, 4] },
          D: { 0: [0, 1, 2, 3], 1: [0, 4], 2: [0, 4], 3: [0, 4], 4: [0, 4], 5: [0, 4], 6: [0, 1, 2, 3] },
          E: { 0: [0, 1, 2, 3, 4], 1: [0], 2: [0], 3: [0, 1, 2, 3], 4: [0], 5: [0], 6: [0, 1, 2, 3, 4] },
          J: { 0: [2, 3], 1: [3], 2: [3], 3: [3], 4: [3], 5: [1, 3], 6: [1, 2, 3] },
          I: { 0: [0,1,2], 1: [1], 2: [1], 3: [1], 4: [1], 5: [1], 6: [0,1, 2] },
          M: { 0: [0,1,3,4], 1: [0,2,4,], 2: [0,4], 3: [0,4], 4: [0,4], 5: [0,4], 6: [0,4] },
          O: { 0: [0, 1, 2, 3,4], 1: [0, 4], 2: [0, 4], 3: [0, 4], 4: [0, 4], 5: [0, 4], 6: [0, 1, 2, 3,4] },
          P: { 0: [0, 1, 2, 3, 4], 1: [0, 4], 2: [0, 4], 3: [0, 1, 2, 3, 4], 4: [0], 5: [0], 6: [0] },
          X: { 0: [0, 4], 1: [0, 4], 2: [0, 4], 3: [1, 2, 3], 4: [0, 4], 5: [0, 4], 6: [0, 4] },
          Y: { 0: [0, 4], 1: [0, 4], 2: [0,1,2,3,4], 3: [2], 4: [2], 5: [2], 6:[2] },
          a: { 2: [0, 1, 2, 3, 4], 3: [4], 4: [0, 1, 2, 3, 4], 5: [0,4], 6: [0, 1, 2, 3, 4] },
          b: { 0: [0], 1:[0], 2: [0, 1, 2, 3, 4], 3: [0, 4], 4: [0, 4], 5: [0,4], 6: [0, 1, 2, 3, 4] },
          c: { 2: [0, 1, 2, 3, 4], 3: [0], 4: [0], 5: [0], 6: [0, 1, 2, 3, 4] },
          d: { 0: [4], 1:[4], 2: [0, 1, 2, 3, 4], 3: [0, 4], 4: [0, 4], 5: [0,4], 6: [0, 1, 2, 3, 4] },
          e: { 2: [0, 1, 2, 3, 4], 3: [0, 4], 4: [0, 1, 2, 3, 4], 5: [0], 6: [0, 1, 2, 3, 4] },
          h: { 0: [0], 1:[0], 2: [0, 1, 2, 3, 4], 3: [0, 4], 4: [0, 4], 5: [0,4], 6: [0, 4] },
          i: { 0: [0], 2: [0], 3: [0], 4: [0], 5: [0], 6: [0] },
          j: { 0: [2], 2: [2], 3: [2], 4: [2], 5: [2], 6: [2], 7:[2],8:[0,1,2] },
          l: { 0: [0], 1: [0], 2: [0], 3: [0], 4: [0], 5: [0], 6: [0] },
          o: { 2: [0, 1, 2, 3, 4], 3: [0, 4], 4: [0, 4], 5: [0, 4], 6: [0, 1, 2, 3, 4] },
          n: { 2: [0, 1, 2, 3, 4], 3: [0, 4], 4: [0, 4], 5: [0, 4], 6: [0, 4] },
          m: { 2: [0, 1, 2, 3, 4,5,6], 3: [0, 3,6], 4: [0,3,6], 5: [0,3,6], 6: [0, 3,6] },
          r: { 2: [0, 1, 2], 3: [0, 2], 4: [0], 5: [0], 6: [0] },
          s: { 2: [0, 1, 2, 3, 4], 3: [0], 4: [0, 1, 2, 3, 4], 5: [4], 6: [0, 1, 2, 3, 4] },
          t: { 0: [1], 1: [1], 2: [0,1,2], 3: [1], 4: [1], 5: [1], 6: [1,2] },
          u: { 2: [0, 4], 3: [0, 4], 4: [0, 4], 5: [0, 4], 6: [0, 1, 2, 3, 4] },
          w: { 2: [0, 6], 3: [0, 6], 4: [0, 3, 6], 5: [0, 3, 6], 6: [1, 2, 4, 5] },
          x: { 2: [0, 4], 3: [0, 4], 4: [1, 2, 3], 5: [0, 4], 6: [0, 4] },
          '-': { 2: [0,1] },
          '.': { 6:[0]},
          2: { 0: [0, 1, 2, 3,4], 1: [4], 2: [4], 3: [0,1,2,3, 4], 4: [0], 5: [0], 6: [0, 1, 2, 3,4] },
          
      }

  },

  tiny: {
      h:7,
      w:3,
      char:{
          0: {0:[0,1,2],1:[0,2],2:[0,2],3:[0,2],4:[0,1,2]},
          1: {0:[0,1],1:[1],2:[1],3:[1],4:[1]},
          2: {0:[0,1,2],1:[2],2:[0,1,2],3:[0],4:[0,1,2]},
          3: {0:[0,1,2],1:[2],2:[1,2],3:[2],4:[0,1,2]},
          4: {0:[0,2],1:[0,2],2:[0,1,2],3:[2],4:[2]},
          5: {0:[0,1,2],1:[0],2:[0,1,2],3:[2],4:[0,1,2]},
          6: {0:[0,1,2],1:[0],2:[0,1,2],3:[0,2],4:[0,1,2]},
          7: {0:[0,1,2],1:[2],2:[1],3:[1],4:[1]},
          8: {0:[0,1,2],1:[0,2],2:[0,1,2],3:[0,2],4:[0,1,2]},
          9: {0:[0,1,2],1:[0,2],2:[0,1,2],3:[2],4:[0,1,2]},
          A: {0:[0,1,2],1:[0,2],2:[0,1,2],3:[0,2],4:[0,2]},
          C: {0:[0,1,2],1:[0,2],2:[0],3:[0,2],4:[0,1,2]},
          G: {0:[0,1,2],1:[0],2:[0,2],3:[0,2],4:[0,1,2]},
          H: {0:[0,2],1:[0,2],2:[0,1,2],3:[0,2],4:[0,2]},
          I: {0:[0],1:[0],2:[0],3:[0],4:[0]},
          K: {0:[0,2],1:[0,2],2:[0,1],3:[0,2],4:[0,2]},
          L: {0:[0],1:[0],2:[0],3:[0,2],4:[0,1,2]},
          M: {0:[0,1,2,3,4],1:[0,2,4],2:[0,2,4],3:[0,2,4],4:[0,2,4]},
          N: {0:[0,1,2],1:[0,2],2:[0,2],3:[0,2],4:[0,2]},
          O: {0:[0,1,2],1:[0,2],2:[0,2],3:[0,2],4:[0,1,2]},
          R: {0:[0,1,2],1:[0,2],2:[0,1],3:[0,2],4:[0,2]},
          S: {0:[0,1,2],1:[0],2:[0,1,2],3:[2],4:[0,1,2]},
          ':': {1:[0],3:[0]},
          '.': {4:[0]},
          '-': {2:[0,1]}
      }
  }

}


class Console {}



Console.showSource = file => {

    var req = new XMLHttpRequest()
    req.open( 'GET', file )
    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == 200)
          document.getElementById('source').innerHTML = req.responseText
    }
    req.send()

}

Console.node = el => {

 const e = el.target,
       m = e.parentNode.children[2],
       n = e.parentNode.children[3],
       o = e.parentNode.children[4],
       d = n.style.display

 n.style.display = d === 'none' ? 'block' : 'none'
 m.style.display = d === 'none' ? 'none' : 'inline-block'
 o.style.display = d === 'none' ? 'inline-block' : 'none'
 e.innerText = d === 'none' ? '-' : '+'

}

Console.info = e => {

  let out = ''


  out += '<table class="pos"><tr><th>&nbsp;</th><th>client</th><th>offset</th></tr>'
         + '<tr><td>L:</td><td>'+e.clientLeft+'</td><td>'+e.offsetLeft+'</td></tr>'
         + '<tr><td>T:</td><td>'+e.clientTop+'</td><td>'+e.offsetTop+'</td></tr>'
         + '<tr><td>W:</td><td>'+e.clientWidth+'</td><td>'+e.offsetWidth+'</td></tr>'
         + '<tr><td>H:</td><td>'+e.clientHeight+'</td><td>'+e.offsetHeight+'</td></tr>'
       + '</table>'

  out += '<table class="css">'

  let keys = Object.keys(e.css)
  keys.sort()
  for(let a = 0, an = keys.length; a < an; a += 1) 
      out += '<tr><td>' + keys[a] + '<span>:</span></td><td>' + e.css[keys[a]] + '</td></tr>'
  out += '</table>'

  document.getElementById('console').children[1].innerHTML = out
}

Console.tab = t => {

const c = document.getElementById('tools'),
      s = document.getElementsByClassName('tabselector')[0].children

for (let a = 0, an = c.children.length; a < an; a += 1) {

    c.children[a].style.display = 'none'
    s[a].className = ''

}

c.children[t].style.display = 'flex'
s[t].className = 'active'

}


if ( isNode )

  module.exports = {

    PixyBrowser:PixyBrowser
    
  }
  