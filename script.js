/* eslint-disable */
"use strict"

const wysiwyg = document.querySelector('output')
    , textarea = document.querySelector('textarea')
    , strong =  document.querySelector('[value="strong"]')
    , italic =  document.querySelector('[value="i"]')
    , addCommentButton =  document.querySelector('[name="comment"]')
    , toggleCommentButton =  document.querySelector('[value="toggle comments"]')
    , form = document.querySelector('[name="editor"]')
    , actionList = document.querySelector('[name="editor"] > ol')
    , selection = window.getSelection()
    , phrasingContent = ['abbr', 'audio', 'b', 'bdo', 'br', 'button', 'canvas', 'cite', 'code', 'command', 'data', 'datalist', 'dfn', 'em', 'embed', 'i', 'iframe', 'img', 'input', 'kbd', 'keygen', 'label', 'mark', 'math', 'meter', 'noscript', 'object', 'output', 'progress', 'q', 'ruby', 'samp', 'script', 'select', 'small', 'span', 'strong', 'sub', 'sup', 'svg', 'textarea', 'time', 'var', 'video', 'wbr']

wysiwyg.setAttribute('contenteditable', 'true');
wysiwyg.setAttribute('spellcheck', 'true');

textarea.addEventListener("input", function(){
    wysiwyg.innerHTML = textarea.value
})

form.addEventListener("submit", function(evt){
    evt.preventDefault();
})

wysiwyg.addEventListener("paste", function(evt){
    console.log(evt)

    evt.preventDefault();
})

wysiwyg.addEventListener("drop", function(evt){
    console.log(evt)

    evt.preventDefault();
})


wysiwyg.addEventListener("contextmenu", function(evt){
    console.log('context', evt)
})

wysiwyg.addEventListener("input", function(evt){
    console.log('input', evt)
})

wysiwyg.addEventListener("keydown", function(evt){
    console.log(evt)
    textarea.value = wysiwyg.innerHTML
})

document.addEventListener("selectionchange", function() {
    let range = getSelectionRange()
    if(range)
        createAction('selection', {
            "inside-element": getSelectorForElement(range.commonAncestorContainer, wysiwyg),
            "start-element": getSelectorForElement(range.startContainer, range.commonAncestorContainer), 
            "start-node-index": getNodeIndex(range.startContainer), 
            "start-offset": range.startOffset,
            "end-element": getSelectorForElement(range.endContainer, range.commonAncestorContainer),
            "end-node-index": getNodeIndex(range.endContainer),
            "end-offset": range.endOffset
        }, true)
    else
        createAction('selection', {
            "inside-element": 'node',
        }, true)
});

strong.addEventListener("click", addRemoveTagButton);
italic.addEventListener("click", addRemoveTagButton);
addCommentButton.addEventListener("click", addCommentary);
toggleCommentButton.addEventListener("click", toggleCommentary);

let commentsHidden;
function toggleCommentary() {
    commentsHidden ? commentsToCommentary() : commentaryToComments()
    commentsHidden = !commentsHidden;
}

function commentsToCommentary(){
    const commentWalker = document.createTreeWalker(wysiwyg, NodeFilter.SHOW_COMMENT)
        , comments = [];
    while(commentWalker.nextNode()) comments.push(commentWalker.currentNode);
    comments.forEach(function(comment){
        comment.parentNode.replaceChild(comment.data, comment)
    })
}

function commentaryToComments(){
    const quotes = wysiwyg.querySelectorAll('q')
    quotes.forEach(function (quote){
        quote.parentNode.replaceChild(document.createComment(quote.outerHTML), quote)
    })
}

function createCommentaryArticle(id){
    let commentArticle = document.createElement('article');
    commentArticle.setAttribute('contenteditable', 'true');
    commentArticle.setAttribute('spellcheck', 'true');
    commentArticle.id = id;
    return commentArticle;
}

function addCommentary(){
    const range = getSelectionRange()
        , id = 'comment0'
    if(!range) return;
    

    commentsToQuotes();
    const markers = getSetMarkers([
        [range.endContainer, 'comment-end '+id, range.endOffset],
        [range.startContainer, 'comment-start '+id, range.startOffset],
    ].map(function(v){return {node:v[0], name:v[1], offset:v[2]}}));

    console.log(markers)
    markers[0].node.parentNode.insertBefore(createCommentArticle(id), markers[0].node)
}

function addRemoveTagButton(){

    let time = [new Date()] 
        , range = getSelectionRange()
        , value = this.value
        , join = true;

    if(range){
        //add or remove from selection;
        if(!range.collapsed){
            let startWrap = getWrapNode(range.startContainer, value)
                , endWrap = getWrapNode(range.endContainer, value)
                , start = startWrap || range.startContainer
                , end = endWrap || range.endContainer
                , startOffset = startWrap ? 0 : range.startOffset
                , endOffset = endWrap ? 1 : range.endOffset
                , isRemove = isAllContentInsideTag(range, value);

            if(join){
                if(startOffset === 0){
                    start = getFarthestAdjacentwrappedNode(range.startContainer, value, 0)
                    start = start || range.startContainer;
                }
                if(endOffset === end.length){
                    end = getFarthestAdjacentwrappedNode(range.endContainer, value, 1);
                    end = end || range.endContainer
                    endOffset = end.length;
                }
            }

            const markers = getSetMarkers([
                [end, 'wrap-end', endOffset],
                [range.endContainer, 'selection-end', range.endOffset],
                [range.startContainer, 'selection-start', range.startOffset],
                [start,'wrap-start',startOffset]
            ].map(function(v){return {node:v[0], name:v[1], offset:v[2]}}));

            removeAllTagsOfTypeBetween(value, markers['wrap-start'], markers['wrap-end']);
            
            if(isRemove){ 
                wrapContentBetweenWithTag(value, markers['wrap-start'], markers['selection-start'], isPhrasing)
                wrapContentBetweenWithTag(value, markers['selection-end'], markers['wrap-end'], isPhrasing) 
            }else 
                wrapContentBetweenWithTag(value, markers['wrap-start'], markers['wrap-end'], isPhrasing) 

            wysiwyg.querySelectorAll('.marker').forEach(function(marker){
                marker.parentNode.removeChild(marker)
            })
            console.log(range)
            
            createAction('wrapOrUnwrapSelection', {
                "tag": value,
                "is-remove":+isRemove
            })
        }else 
            console.log(isNodeWrapped(range.startContainer, value) ? 'break tag' : 'add tag') 
    } 
    let now = new Date();
    time.map(function(timeAt, i){
        console.log(i+": -"+(now - timeAt))
    })

} 

function getNodeIndex(node){
    let i = 0;
    while( (node = node.previousSibling) != null ) 
        i++;

    return i;
}

function createInput(name, type, value, disabled){
    const input = document.createElement('input') 
    input.type = type;
    input.value = value;
    input.name = name;
    input.disabled = disabled;
    return input;
}

function createAction(actionName, actionArgs, replaceSame){
    const action = document.createElement('li') 
    action.appendChild(createInput('action', 'text', actionName, true));

    for(const key in actionArgs){
        action.appendChild(createInput(key, 'text', actionArgs[key], true));
    }

    if(replaceSame && actionList.lastChild && actionList.lastChild.querySelector('input[name="action"]').value === actionName){
        actionList.replaceChild(action, actionList.lastChild);
    }else{
        actionList.appendChild(action);
    }

}

/**
 * @param array[i].node node
 * @param array[i].name name
 * @param array[i].index index
 */
function getSetMarkers(array){ 
    let markers = {}
        , ii;

    array.filter(function(v, i, a){
        const markerRef = {name:v.name, offset:v.offset}
        let unique = true;
        v.markers = [markerRef]
        for(ii = 0; ii<i ;ii++){
            if(a[ii].node === v.node){
                a[ii].markers.push(markerRef)
                unique = false;
                break;
            }
        }
        return unique
    }).forEach(function(v){
        let node = v.node, nodeMarkers = v.markers.sort(function(a, b){a > b});
        for(let i = 0,l=nodeMarkers.length; i<l; i++){
            let markerName = nodeMarkers[i].name, offset = nodeMarkers[i].offset;
            const marker = document.createElement('span') 
            marker.className = 'marker '+markerName; 
            if(node.nodeType === 3){
                v[0] = node.splitText(offset);
                node.parentNode.insertBefore(marker, v[0]);
            }else 
                if(offset === 0) 
                    node.parentNode.insertBefore(marker, node) 
                else
                    if(node === node.parentNode.lastChild) 
                        node.parentNode.appendChild(marker)
                    else 
                        node.parentNode.insertBefore(marker, node.nextSibling) 

                    markers[markerName] = marker;
        }
    })
    
    return markers; 
} 
function any(node){
    return true;
}

function isPhrasing(node){
    return node.nodeType === 3 || phrasingContent.indexOf(node.localName.toLowerCase()) !== -1;
}

function wrapContentBetweenWithTag(value, start, end, wrapAllowed){
    let nodes = getNodesInBetween(start, end)
        , join = []

    while(nodes.length > 0){
        let node = nodes.shift()
        if(wrapAllowed(node)){
            join.push(node)
            if(nodes.length > 0 && nodes[0] === node.nextSibling)
                continue
        }else
            node.childNodes.forEach(function(v){nodes.push(v)})
        
        const wrap = document.createElement(value);

        if(node.nextSibling) 
            node.parentNode.insertBefore(wrap, node.nextSibling)
        else
            node.parentNode.appendChild(wrap)

        join.map(function(v){return wrap.appendChild(v)});
        join = [];
    }
}

function removeAllTagsOfTypeBetween(type, start, end){ 
    getNodesInBetween(start, end).forEach(function(node){
        if(node.nodeType === 1){ 
            node.querySelectorAll(type).forEach(function(childNode){ 
                removeWrappingNode(childNode) 
            }) 
            if(isMatchedNode(node, type)) 
                removeWrappingNode(node); 
        } 
    }) 
} 


function getSelectionRange(){ 
    if(selection.rangeCount){ 
        let range = selection.getRangeAt(0) 
        if(wysiwyg.contains(range.commonAncestorContainer)) 
            return range; 
    } 
    return null; 
} 

function getNextChildlessNode(node, direction){ 
    const getSibling = ['previousSibling','nextSibling'] 
        , getChild = ['lastChild', 'firstChild'] 
    let nextChildLess = false; 

    while(!node[getSibling[direction]]){ 
        node = node.parentNode; 
        if(!node || node === wysiwyg){ 
            return false; 
        } 
    } 

    nextChildLess = node[getSibling[direction]] 
    if(nextChildLess){ 
        while(nextChildLess.hasChildNodes()){ 
            nextChildLess = nextChildLess[getChild[direction]]; 
        } 
    } 
    return nextChildLess; 
} 

function getFarthestAdjacentwrappedNode(node, wrap, direction){ 
    let foundNode = getWrapNode(node, wrap) 
        , newFoundNode 
    
    while(node = getNextChildlessNode(node, direction)){ 
        newFoundNode = getWrapNode(node, wrap) 
        if(!newFoundNode) break; 
        else 
            foundNode = newFoundNode 
            node = foundNode; 
    } 
    return foundNode; 
} 

function getNodesFromTo(start, end, commonAncestorContainer){ 
    return [start, end].concat(getNodesInBetween(start, end, commonAncestorContainer)); 
} 

function isAllContentInsideTag(range, tag){ 
    return getNodesFromTo(range.startContainer, range.endContainer, range.commonAncestorContainer).every(function(v){ 
        return isNodeWrapped(v, tag) || isContentWrapped(v, tag) 
    }) 
} 

function getWrapNode(node, wrap, rootNode){ 
    rootNode = rootNode || wysiwyg; 
    let ancestors = getTreeForNode(node, rootNode) 
        , found = false; 

    for(let i = 0, l = ancestors.length; i<l; i++) 
        if(ancestors[i].localName.toLowerCase() === wrap){ 
            found = ancestors[i]; 
            break; 
        } 
        return found;
}

function isNodeWrapped(node, wrap, rootNode){
    return !!getWrapNode(node, wrap, rootNode);
}

function isMatchedNode(node, nodeName, classes){
    classes = Array.isArray(classes) && classes || typeof classes === 'string' && classes.split(/\s+/);
    switch(true){
        case (nodeName && (!node.localName || node.localName.toLowerCase() !== nodeName.toLowerCase())):
        case (classes && (!node.className || classes.every(function(v){return node.className.split(/\s+/).indexOf(v)}))):
            return false;
        default: return true;
    }
}

function isContentWrapped(node, wrapName, wrapClasses){
    let nodes = [];

    while(node){
        if(!isMatchedNode(node, wrapName, wrapClasses))
            if(!node.childNodes ||node.childNodes.length === 0)
                //found a dead end, not all content is wrapped in node
                return false;       
            else
                nodes.unshift.apply(nodes, [].slice.call(node.childNodes))

        node = nodes.shift()
    }  
    return true;
}

//
function getNodesInBetween(startNode, endNode, rootNode){
    rootNode = rootNode || wysiwyg;
    let fullSelectedNodes = [];

    if(startNode !== endNode && startNode.nextSibling !== endNode){
        let nodes = [].slice.call(rootNode.childNodes)
            , include = false;

        for(let i = 0, currentnode; i<nodes.length; i++){
            currentnode = nodes[i];
            //start adding after the start container is found
            if(currentnode === startNode){
                include = true;
                continue;
            }
            //stop after endocontainer
            if(currentnode === endNode)
                break;
            //if the node contains the start or end of the sleection continue to walk child nodes to refine selection
            if(currentnode.contains(startNode) || currentnode.contains(endNode)){
                nodes = nodes.slice(0, i+1).concat([].slice.call(currentnode.childNodes), nodes.slice(i+1))
                continue;
            }
            if(include)
                fullSelectedNodes.push(currentnode)
        }
    }
    return fullSelectedNodes;
}

function removeWrappingNode(node){
    const parent = node.parentNode;
    if(parent){
        while(node.hasChildNodes()){
            parent.insertBefore(node.firstChild, node); 
        }
        parent.removeChild(node)
        parent.normalize();
    }
}

//get tree
function getTreeForNode(node, rootNode){
    rootNode = rootNode || wysiwyg;
    let tree = []

    while(node !== rootNode){
        node = node.parentNode;
        tree.unshift(node)
    }
    return tree;
}

function getSelectorForElement(node, rootNode){
    return node === rootNode ? "" : getRichTreeForElement(node, rootNode).reduce(function(selector, node){
        return selector + (selector && " > ") + node.localName + ":nth-of-type(" +(node.nthOfType||1) + ")"
    }, "");
}

//get tree with the nth of type set, to be able to create a selector for the node;
function getRichTreeForElement(node, rootNode){
    let i, l, treeChilds, nodeName, nthOfType 
        , tree = [(rootNode||wysiwyg)] 
        , setup = function(){
            treeChilds = tree[tree.length - 1].children ? [].slice.call(tree[tree.length - 1].children): []; 
            i = -1; 
            l = treeChilds.length;
            nthOfType = {};
        }

        for(setup(), i++; i<l ;i++){
            nodeName = treeChilds[i].nodeName;
            nthOfType[nodeName] = nthOfType[nodeName] && nthOfType[nodeName]+1 || 1;
            if(treeChilds[i].contains(node)){
                treeChilds[i].nthOfType = nthOfType[nodeName];
                tree.push(treeChilds[i]);
                setup();
            }
        }
        return tree;
}
