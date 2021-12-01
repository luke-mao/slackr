"use strict";


// remove all child
const clearAllChildNodes = (node) => {
  while (node.firstChild) {
    node.removeChild(node.lastChild);
  }
};


// append a list of child
const appendAllChildNodes = (node, childNodeList) => {
  // check if the input is a list
  if (!Array.isArray(childNodeList)) {
    console.log("ERROR: appendAllChildNodes input not a list");
    return;
  }

  for (const childNode of childNodeList) {
    node.appendChild(childNode);
  }
}


// given an array of new child nodes, all insert before a reference node
const insertAllChildNodesBeforeNode = (parentNode, referenceNode, childNodeList) => {
  // check if the input is a list
  if (!Array.isArray(childNodeList)) {
    console.log("ERROR: appendAllChildNodes input not a list");
    return;
  }

  for (const childNode of childNodeList) {
    parentNode.insertBefore(childNode, referenceNode);
  }
}


// create the new DOM element,
// input the tag, class name as a list, and other props
const createElement = ({tag=null, classes=[], ...otherProps}) => {
  if (!tag) {
    console.log("create element error: no tag");
    return;
  }

  const element = document.createElement(tag);

  // use for...of instead of for...in
  if (classes.length !== 0) {
    for (const className of classes) {
      element.classList.add(className);
    }
  }

  // if other props exist, add into it
  for (const attribute of Object.keys(otherProps)) {
    const value = otherProps[attribute];

    switch(attribute) {
      case 'textContent':
        element.textContent = value;
        break;
      case 'alt':
        element.alt = value;
        break;
      case 'for':
        element.for = value;
        break;
      case 'src':
        element.src = value;
        break;
      case 'placeholder':
        element.placeholder = value;
        break;
      case 'type':
        element.type = value;
        break;
      case 'href':
        element.href = value;
        break;
      case 'onclick':
        // the onclick value must be a () => {} callback function
        element.onclick = value;
        break;
      default:
        element.setAttribute(attribute, value);
        break;
    }
  }

  return element;
}


// given the ISO time string, format time to xx:xx xx/xx/xxxx
const formatTimeToString = (timeString) => {
  const dt = new Date(timeString);

  let hour = dt.getHours().toString();
  if (hour.length == 1) {
    hour = `0${hour}`;
  }

  let minute = dt.getMinutes().toString();
  if (minute.length == 1) {
    minute = `0${minute}`;
  }

  let seconds = dt.getSeconds().toString();
  if (seconds.length == 1) {
    seconds = `0${seconds}`
  }

  let day = dt.getDate().toString();
  if (day.length == 1) {
    day = `0${day}`;
  } 

  let month = (dt.getMonth() + 1).toString();
  if (month.length == 1) {
    month = `0${month}`;
  }

  const year = dt.getFullYear();

  const output = `${hour}:${minute}:${seconds}  ${day}/${month}/${year}`;
  return output;
}


// get current time
const formatCurrentTime = () => {
  const dt = new Date();

  let hour = dt.getHours().toString();
  if (hour.length == 1) {
    hour = `0${hour}`;
  }

  let minute = dt.getMinutes().toString();
  if (minute.length == 1) {
    minute = `0${minute}`;
  }

  let seconds = dt.getSeconds().toString();
  if (seconds.length == 1) {
    seconds = `0${seconds}`
  }

  let day = dt.getDate().toString();
  if (day.length == 1) {
    day = `0${day}`;
  } 

  let month = (dt.getMonth() + 1).toString();
  if (month.length == 1) {
    month = `0${month}`;
  }

  const year = dt.getFullYear();

  const output = `${hour}:${minute}:${seconds}  ${day}/${month}/${year}`;
  return output;
}



// export all
export { 
  clearAllChildNodes, appendAllChildNodes, insertAllChildNodesBeforeNode, createElement, 
  formatTimeToString, formatCurrentTime 
};

