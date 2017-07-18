
"use strict"

const wysiwyg = document.querySelector('output')
    , textarea = document.querySelector('textarea')
    , strong =  document.querySelector('[value="strong"]')
    , form = document.querySelector('form')
    , selection = window.getSelection();

let range;

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
  if(selection.rangeCount){
    range = selection.getRangeAt(0) 
  }
  //let selected = getNodesInBetween(range.startContainer, range.endContainer, range.commonAncestorContainer);
  //console.log(selected)
});

strong.addEventListener("click", addRemoveTagButton);

function addRemoveTagButton(){
  let range = getRange()
    , value = this.value;
  if(range){
    //add or remove from selection;
    if(!range.collapsed)
      if(isAllContentInsideTag(range, value))
        console.log('remove (partial) tags')
      else
        console.log('add/join tags on content')
    else
      console.log(isNodeWrapped(range.startContainer, value) ? 'break tag' : 'add tag')
  }
}

function getRange(){
  if(selection.rangeCount){
    let range = selection.getRangeAt(0) 
    if(wysiwyg.contains(range.commonAncestorContainer)){
      return range;
    }
  }
  return null;
}

function isAllContentInsideTag(range, tag){
  return [range.startContainer, range.endContainer].concat(
    getNodesInBetween(
      range.startContainer, range.endContainer, range.commonAncestorContainer
    )
  ).every(function(v){
    return isNodeWrapped(v, tag, range.commonAncestorContainer) || isContentWrapped(v, tag)
  })
}

function isNodeWrapped(node, wrap, rootNode){
  rootNode = rootNode || wysiwyg;
  let ancestors = getTreeForNode(node, rootNode)
    , found = false;
  for(let i = 0, l = ancestors.length; i<l; i++)
    if(ancestors[i].localName.toLowerCase() === wrap)
      found = true;
  return found;
}

function isContentWrapped(node, wrap){
  wrap = wrap.toLowerCase();
  let nodes = [];
  while(node){
    if(!node.localName || node.localName.toLowerCase() !== wrap){
      if(!node.childNodes ||node.childNodes.length === 0){
        //found a dead end, not all content is wrapped in node
        return false
      }else{
        nodes.unshift.apply(nodes, [].slice.call(node.childNodes))
      }
    }
    node = nodes.shift()
  }  
  return true;
}

function getSelectorForTree(tree){
  return tree.reduce(function(selector, node){
    return selector + (selector && " > ") + node.localName + ":nth-of-type(" +(node.nthOfType||1) + ")"
  },"");
}
//
function getNodesInBetween(startNode, endNode, rootNode){
  rootNode = rootNode || document;
  let fullSelectedNodes = [];
  if(!range.collapsed && startNode !== endNode){
    let nodes = [].slice.call(rootNode.childNodes)
    , include = false;

    for(let i = 0, currentnode; i<nodes.length; i++){
      currentnode = nodes[i];
      
      //start adding after the start container is found
      if(currentnode === startNode){
        include = !include;
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

function getTreeForNode(node, rootNode){
  //tree for selected/cursor
  let i, l, treeChilds, nodeName, nthOfType, 
      tree = [(rootNode||document)], 
      setup = function(){
          treeChilds = [].slice.call(tree[tree.length - 1].children), 
          i = -1, 
          l = treeChilds.length,
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
