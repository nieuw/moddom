
"use strict"

const wysiwyg = document.querySelector('output')
    , textarea = document.querySelector('textarea')
    , strong =  document.querySelector('[value="strong"]')
    , form = document.querySelector('form')
    , selection = window.getSelection();

wysiwyg.setAttribute('contenteditable', 'true');
wysiwyg.setAttribute('spellcheck', 'true');

textarea.addEventListener("input", function(){
    wysiwyg.innerHTML = textarea.value
})

wysiwyg.addEventListener("keyup", function(){
    textarea.value = wysiwyg.innerHTML
})

form.addEventListener("submit", function(evt){
    evt.preventDefault();
})


document.addEventListener("selectionchange", function() {
    //let selected = getNodesInBetween(range.startContainer, range.endContainer, range.commonAncestorContainer);
    //console.log(selected)
});

strong.addEventListener("click", addRemoveTagButton);

function addRemoveTagButton(){
    let range = getSelectionRange()
        , value = this.value
        , join = true;

    if(range){
        //add or remove from selection;
        if(!range.collapsed){
            if(isAllContentInsideTag(range, value))
                console.log('remove (partial) tags')
            else{
                let startWrap = getWrapNode(range.startContainer, value)
                    , endWrap = getWrapNode(range.endContainer, value)
                    , start = startWrap || range.startContainer
                    , end = endWrap || range.endContainer
                    , startOffset = startWrap ? 0 : range.startOffset
                    , endOffset = endWrap ? 1 : range.endOffset

                if(join){
                    if(startOffset === 0)
                        start = getFarthestAdjacentwrappedNode(range.startContainer, value, 0)
                    if(endOffset === end.length){
                        end = getFarthestAdjacentwrappedNode(range.endContainer, value, 1);
                        endOffset = end.length;
                    }
                }
                
                console.log(endOffset);
                [
                    [start,'wrap-start',startOffset]
                    ,[end, 'wrap-end', endOffset]
                    ,[range.startContainer, 'selection-start', range.startOffset]
                    ,[range.endContainer, 'selection-end', range.endOffset]
                ].forEach(function(v){
                    //setMarker.apply(null, v)
                })

                getNodesFromTo(start, end).map(function(node){
                    //if(isMatchedNode(node, value))
                        //removeWrappingNode(node);
                    if(node.hasChildNodes())
                       console.dir(node.childNodes)
                })
                      

                if(startWrap){
                    removeWrappingNode(startWrap);
                }
            }
        }else
            console.log(isNodeWrapped(range.startContainer, value) ? 'break tag' : 'add tag')

    }
}
function setMarker(node, markerID, offset){
    let marker = '<span id="'+markerID+'"></span>';
    console.log(node)
    if(node.nodeType === 3){
        let parent = node.parentNode
            ,dummy = document.createElement('div')
            ,frag = document.createDocumentFragment()
            ,child

        dummy.innerHTML = node.nodeValue.slice(0, offset)+marker+node.nodeValue.slice(offset)
        while(child = dummy.firstChild)
            frag.appendChild(child)
        
        parent.replaceChild(frag, node)
    }else{
        console.log(offset)
        node.innerHTML = marker + node.innerHTML;
    }
    
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
    let foundNode = false
        , newFoundNode

    while(node = getNextChildlessNode(node, direction)){
        newFoundNode = getWrapNode(node, wrap)
        if(!newFoundNode)
            break;
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
        console.log(v, isNodeWrapped(v, tag), isContentWrapped(v, tag))
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
    return getRichTreeForElement(node, rootNode).reduce(function(selector, node){
        return selector + (selector && " > ") + node.localName + ":nth-of-type(" +(node.nthOfType||1) + ")"
    },"");
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
