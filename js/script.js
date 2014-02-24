'use strict';
(function () {
    var nestedColumns = {
        //used to set source of dragging items
        dragSrc: {},
        //rules for dragging
        dragRules: {
            //max number of columns allowed
            maxGenerations: 3
        },
        //start a count for new node ids
        newNodes: -1,
        changedItems: {},
        currChange: false,
        init: function () {
            //store this as that
            var that = this;
            //Build first view
            that.buildFirstView(that.newCurriculum);
            //Set click event on all items
            $('.item').click(function () {
                that.select(this);
            });

            //add the add item functionality
            $('.addItem').click(function () {
                that.addItem($(this).siblings('ul'));
            });

            //set deleter
            //todo: tell keith he is a dummy because what item do you delete
            $('.deleter').click(function () {
                that.deleteItem($('.current'));
            });

            //init dragging code
            that.dragSet();
        },
        //method to build initial view
        buildFirstView : function (curriculum) {
            //base class array
            var mainColumn = $('#mainCol');
            var baseClasses = curriculum.children;
            var baseClassLabels = $();
            mainColumn.attr('data-nid', curriculum.nid);
            //Build the main nav items
            $('<li class="slot" dragUnsetSlot="true"></li>').appendTo(mainColumn);
            $.each(baseClasses, function (index, value) {
                baseClassLabels = baseClassLabels.add(
                        $('<li class="item"></li>')
                            .attr('draggable', true)
                            .attr('dragUnsetItem', true)
                            .append(
                                $('<h3>' + value.label + '</h3>')
                                    .attr('data-nid', value.nid)
                                    .attr('data-index', index)
                            )
                    ).add($('<li class="slot"></li>')
                        .attr('dragUnsetSlot', true)
                    );
            });
            //Append them to the first column
            mainColumn.append(baseClassLabels);
        },
        //method for selecting an element
        select: function (item) {
            var that = this;
            var thisId = $(item).find('h3').attr('data-nid');
            var thisIndex = $(item).find('h3').attr('data-index');
            var thisItemTitle = $(item).children('h3').html();
            var thisAncestry = $(item).parent().attr('data-ancestry');
            var generation = thisAncestry.split('.').length;
            var newFamily;

            //check if this item is active
            //or if this isn't an item (no h3)
            //if it is do nothing
            if ($(item).hasClass('active') || !thisItemTitle) {
                return false;

            //if it isn't active remove other columns after this one
            } else if ($(item).siblings().hasClass('active')) {
                $(item).parents('section').nextAll().remove();
            }

            //remove active class from all siblings
            $(item).siblings().removeClass('active');
            $('.item').removeClass('current');

            //add active class to this item
            $(item).addClass('active').addClass('current');

            //Check if this is the root column
            //if not add to the ancestry
            //else make this ancestry equal to clicked item
            if (thisAncestry !== 'root') {
                thisAncestry += '.' + thisIndex;
            } else {
                thisAncestry = thisIndex;
            }

            newFamily = that.getFamily({
                index: thisAncestry,
                nid: thisId,
                title: thisItemTitle
            });
            //display next container
            if (generation < that.dragRules.maxGenerations) {
                this.showChildContainer(newFamily, thisAncestry, thisItemTitle);
            }
        },
        //method to update node info
        updateNodes: function (info) {
            var that = this;
            var nid = info.nid;
            var weight = info.weight;
            var label = info.label;
            var parent = info.parent;
            if (!that.changedItems[nid]) {
                that.changedItems[nid] = {};
            }
            that.changedItems[nid].nid = nid;
            if (weight || weight === 0) {
                that.changedItems[nid].weight = weight;
            }
            if (label) {
                that.changedItems[nid].label = label;
            }
            if (parent || parent === 0) {
                that.changedItems[nid].parent = parent
            }
        },
        //method to show new container
        showChildContainer: function (family, ancestry, title) {
            var that = this;
            var thisNode = family.nid;
            var thisChildren = family.children;

            //Create and append new container
            var newColContainer = $('<section class="colWrapper"></section>');
            newColContainer.appendTo('.nestableWrapper');

            //add header to this column
            $('<header>' +
                '<span class="sectionTitle">' + title + '</span>' +
                '<div class="addItem">+</div>' +
                '</header>'
            ).appendTo(newColContainer);

            //create column add attributes
            $('<ul/>', {
                'class': 'column',
                'data-ancestry': ancestry,
                'data-nid': thisNode
            }).appendTo(newColContainer);
            var thisColumn = newColContainer.children('ul');

            //Add top slot item
            $('<li class="slot" dragUnsetSlot="true"></li>').appendTo(thisColumn);

            //get clicked item children and build list items from them
            for (var i in thisChildren) {
                var title = thisChildren[i].label;
                var id = thisChildren[i].nid;
                var index = i;
                $('<li class="item" draggable="true" dragUnsetItem="true">' +
                    '<h3 data-nid="' + id + '" data-index="' + index + '">' + title + '</h3>' +
                    '</li>' +
                    '<li class="slot" dragUnsetSlot="true"></li>'
                ).appendTo(thisColumn);
            }

            //add select method to all new items
            //add add item method to new column
            var thisColumnItems = thisColumn.find('.item');
            thisColumnItems.click(function () {
                that.select(this);
            });

            newColContainer.find('.addItem').click(function () {
                that.addItem($(this).parents().siblings('ul'));
            });

            that.dragSet();

        },
        //method to add new item
        addItem: function (el) {
            var that = this;

            //append the new item
            $('<li draggable="true" dragUnsetItem="true"><input type="text" data-nid="' + that.newNodes + '"></li>')
                .addClass('item')
                .on({
                    click: function (event) {
                        that.select(this);
                    }
                })
                .appendTo(el)
                //add focus to new input element and function to create new h3 when user hits enter
                .children('input')
                .focus()
                .keyup(function (event) {
                    if (event.keyCode === 13) {
                        $('<h3 data-nid="' + $(this).attr('data-nid') + '" data-index="' + ($(this).parent().index() - 1) / 2 + '">'
                            + $(this).val() + '' +
                            '</h3>').appendTo($(this).parent());
                        var thisAncestry;
                        if ($(this).parents('ul').attr('data-ancestry') === 'root') {
                            thisAncestry = ($(this).parent().index() - 1) / 2;
                        } else {
                            thisAncestry = $(this).parents('ul').attr('data-ancestry') + '.' + ($(this).parent().index() - 1) / 2;
                        }
                        that.getFamily({
                            index: thisAncestry.toString(),
                            title: $(this).val(),
                            nid : $(this).attr('data-nid'),
                            update: true
                        });
                        that.updateNodes({
                            nid: $(this).attr('data-nid'),
                            label: $(this).val()
                        });
                        $(this).remove();
                    }
                }
            );

            //append new spacer
            $('<li class="slot" dragUnsetSlot="true"></li>').appendTo(el);

            //Check if this is the root column
            //if not add to the ancestry
            //else make this ancestry equal to clicked item
            var newIndex = el.children().last().index() / 2 - 1;
            if (el.attr('data-ancestry') !== 'root') {
                //Add this to the object for tracking purposes
                that.getFamily({
                    index: el.attr('data-ancestry') + '.' + newIndex,
                    nid: null,
                    title: null
                });
            } else {
                that.getFamily({
                    index: newIndex.toString(),
                    nid: null,
                    title: null
                });
            }

            that.dragSet();
            that.updateNodes({
                nid: that.newNodes,
                weight: newIndex,
                label: null,
                parent: el.attr('data-nid')
            });
            that.newNodes--;
        },
        dragSet : function () {
            var dragUnset = document.querySelectorAll('[dragUnsetItem]');
            var dragUnsetSlot = document.querySelectorAll('[dragUnsetSlot]');
            var that = this;

            //function to build info of d & d items
            var dragInfo = function (el, action) {
                var h3 = el.querySelector('h3');
                var parent = el.parentNode;
                var id = h3.getAttribute('data-nid');
                var index = h3.getAttribute('data-index');
                var title = h3.innerHTML;
                var parentAncestry = parent.getAttribute('data-ancestry');
                var elInfo = [];
                //Give the current weight of the element
                elInfo.push({
                    weight: index
                });
                //Get the elements family info
                if (parentAncestry !== 'root' && action !== 'slot') {
                    elInfo.push(that.getFamily({
                        nid: id,
                        label: title,
                        index: parentAncestry + '.' + index
                    }));
                    //Get the elements parents info
                    elInfo.push(parentAncestry);
                } else {
                    elInfo.push(that.getFamily({
                        nid: id,
                        label: title,
                        index: index
                    }));
                    //Get the elements parents info
                    elInfo.push(parentAncestry);
                }

                return elInfo;
            };

            //Drag start handler
            var dragStartHandler = function (e) {
                this.setAttribute('dragging', true);
                that.dragSrc = this;
                //If the current object is active close all of it's children columns
                if ($(this).hasClass('active')) {
                    $(this).parents('section').nextAll().remove();
                    $(this).removeClass('active');
                }
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('json', JSON.stringify(dragInfo(this, 'drag')));
                e.dataTransfer.setData('text/html', this.innerHTML);
            };

            //Drag over handler
            var dragOverHandler = function (e) {
                if (e.preventDefault) {
                    e.preventDefault();
                }

                e.dataTransfer.dropEffect = 'move';

                return false;
            };

            //Drag enter handler
            var dragEnterHandler = function (e) {
                if (this.getAttribute('dragging')) {
                    return false;
                }

                if (this.querySelector('h3')) {
                    this.querySelector('h3').classList.add('over');
                } else {
                    this.classList.add('over');
                }
            };

            //Drag leave handler
            var dragLeaveHandler = function (e) {
                if (this.querySelector('h3')) {
                    this.querySelector('h3').classList.remove('over');
                } else {
                    this.classList.remove('over');
                }
            };

            //Drag end handler
            var dragEndHandler = function (e) {
                if (document.querySelector('.over')) {
                    document.querySelector('.over').classList.remove('over');
                }
                document.querySelector('[dragging]').removeAttribute('dragging');
                if (that.currChange) {
                    var removeMe = $(e.srcElement);
                    var target;
                    if (that.currChange.method === 'slot') {
                        target = $('[data-nid="' + that.currChange.target + '"] .item');
                        var targetEl;
                        //remove slot before this item
                        removeMe.prev().remove();
                        //If no elements exist yet
                        if (!target.length) {
                            removeMe.appendTo($('section > [data-nid="' + that.currChange.target + '"]'));
                            $('<li class="slot" dragUnsetSlot="true"></li>').insertAfter(removeMe);
                        //if it's not the last element in the column
                        } else if (that.currChange.newWeight !== target.length) {
                            targetEl = target[that.currChange.newWeight];
                            removeMe.insertBefore(targetEl);
                            $('<li class="slot" dragUnsetSlot="true"></li>').insertBefore(targetEl);
                        } else {
                            targetEl = target[that.currChange.newWeight - 1];
                            removeMe.insertAfter(targetEl);
                            $('<li class="slot" dragUnsetSlot="true"></li>').insertAfter(targetEl);
                        }
                    } else {
                        target = $('section > [data-nid="' + that.currChange.target + '"]');
                        removeMe.prev().remove();
                        //if the column you drop on is opened append it to the end, otherwise just remove it
                        if (target.length) {
                            removeMe.appendTo(target);
                            $('<li class="slot" dragUnsetSlot="true"></li>').insertAfter(removeMe);
                        } else {
                            removeMe.remove();
                        }
                    }
                    that.currChange = false;
                    that.reIndex();
                    that.dragSet();
                }
            };

            //drop handler
            var dropHandler = function (e) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }

                //Don't fire on the same element
                if (that.dragSrc !== this) {
                    //get the family of the element you are dropping
                    //and the family of the element you dropped it on
                    var droppedFamily = JSON.parse(e.dataTransfer.getData('json'));
                    var targetFamily;
                    var deleteFrom = that.getFamily({
                        index: droppedFamily[2],
                        id: null,
                        label: null
                    });

                    //get generation of target element
                    var generation = this.parentNode.getAttribute('data-ancestry').split('.').length;
                    //get generation count of dropped element
                    var dropGen = droppedFamily[1].children.length;
                    var dropGenDescendants;


                    //if you dropped it on an empty slot, get the family of the parent element
                    if (!this.childNodes.length) {
                        targetFamily = that.getFamily({
                            index: this.parentNode.getAttribute('data-ancestry'),
                            id: this.parentNode.getAttribute('data-nid'),
                            label: null
                        });
                        //check for legal move
                        if (dropGen) {
                            dropGenDescendants = that.generationCount(droppedFamily[1].children);
                            if ((generation + dropGenDescendants) > that.dragRules.maxGenerations) {
                                alert('This item has too many descendants to go here.');
                                return false;
                            }
                        }

                        //Splice this new arrangement into the curriculum object
                        var newWeight = $(this).index() / 2;
                        that.spliceIn({
                            spliceMe: targetFamily,
                            injectMe: droppedFamily[1],
                            newWeight: newWeight,
                            oldWeight: parseInt(droppedFamily[0].weight, 10),
                            deleteFrom: deleteFrom
                        });
                        that.currChange = {
                            method: 'slot',
                            newWeight: newWeight,
                            target: targetFamily.nid
                        };
                    } else {
                        targetFamily = dragInfo(this, 'drop');
                        if (!targetFamily[1].children) {
                            targetFamily[1].children = [];
                        }
                        //check for legal move
                        if (dropGen) {
                            dropGenDescendants = that.generationCount(droppedFamily[1].children);
                        } else {
                            dropGenDescendants = 0;
                        }
                        if ((generation + dropGenDescendants) >= that.dragRules.maxGenerations) {
                            alert('This item has too many descendants to go here.');
                            return false;
                        }
                        that.spliceIn({
                            spliceMe: targetFamily[1],
                            injectMe: droppedFamily[1],
                            newWeight: targetFamily[1].children.length,
                            oldWeight: parseInt(droppedFamily[0].weight, 10),
                            deleteFrom: deleteFrom
                        });
                        that.currChange = {
                            method: 'move',
                            target: targetFamily[1].nid
                        };
                    }
                }

                return false;
            };
            [].forEach.call(dragUnset, function (el) {
                el.addEventListener('dragstart', dragStartHandler, false);
                el.addEventListener('dragenter', dragEnterHandler, false);
                el.addEventListener('dragover', dragOverHandler, false);
                el.addEventListener('dragleave', dragLeaveHandler, false);
                el.addEventListener('drop', dropHandler, false);
                el.addEventListener('dragend', dragEndHandler, false);
                el.removeAttribute('dragUnsetItem');
            });
            [].forEach.call(dragUnsetSlot, function (el) {
                el.addEventListener('dragenter', dragEnterHandler, false);
                el.addEventListener('dragover', dragOverHandler, false);
                el.addEventListener('dragleave', dragLeaveHandler, false);
                el.addEventListener('drop', dropHandler, false);
                el.removeAttribute('dragUnsetSlot');
            });
        },
        //Method to delete items
        deleteItem: function (item) {
            var el = item;
            var elChild = $(item.children('h3'));
            var itemId = elChild.attr('data-nid');
            var index = elChild.attr('data-index');
            var ancestry = $(el.parents('ul')).attr('data-ancestry');
            var box = el.parents('section').nextAll('section');
            var that = this;
            var deleteFrom;
            var deleteMe;
            var warn = true;
            if (ancestry === 'root') {
                deleteMe = that.getFamily({
                    index: index
                });
            } else {
                deleteMe = that.getFamily({
                    index: ancestry + '.' + index
                });
            }
            if (deleteMe.children.length) {
                warn = confirm('This item has descendants, are you sure you want to delete it?');
            }
            if (warn) {
                deleteFrom = that.getFamily({
                    index: ancestry,
                    title: null,
                    nid: null
                });
                deleteFrom.children.splice(index, 1);
                box.remove();
                el.prev().remove();
                el.remove();
                that.reIndex(deleteFrom);
            }

        },
        //Method to count generations
        generationCount: function (children) {
            //start count at 1 for first generation
            var count = 1;
            var childrensChildren = children;
            //recursive strategy to count generations
            var counter = function () {
                var kids = childrensChildren;
                childrensChildren = [];
                //loop through children to look for more children
                for (var c = 0, l = kids.length; c < l; c++) {
                    //if there are children
                    if (kids[c].children) {
                        if (kids[c].children.length) {
                            //loop through the childrens children and push them to an array
                            for (var cc = 0, cl = kids[c].children.length; cc < cl; cc++) {
                                childrensChildren.push(kids[c].children[cc]);
                            }
                        }
                    }
                }
                //if the array has any items increment counter and count next items generation
                if (childrensChildren.length && count < 5) {
                    count++;
                    counter(childrensChildren);
                }
            };
            counter();
            return count;
        },
        //Method to reindex everything on change
        reIndex: function (splicedObject) {
            var columns = $('.column');
            var that = this;
            if (splicedObject) {
                var parent = splicedObject.nid;
                $.each(splicedObject.children, function (index, value) {
                    that.updateNodes({
                        parent: parent,
                        nid: value.nid,
                        label: value.label,
                        weight: index
                    });
                });
                console.log(that.changedItems);
            }
            //Loop through the columns
            $.each(columns, function (index, value) {
                //Loop through the items in each column
                $.each($(value).children('.item'), function (index, value) {
                    var that = $(this);
                    var child = $(that.children('h3'));
                    //If the item is active fix the ancestry for it's open column
                    if (that.hasClass('active')) {
                        var thatColumnId = child.attr('data-nid');
                        var thatColumn = $('.colWrapper > [data-nid="' + thatColumnId + '"]');
                        var columnAncestry;
                        var thisAncestry = that.parents('ul').attr('data-ancestry');
                        if (thisAncestry === 'root') {
                            columnAncestry = index;
                        } else {
                            columnAncestry = thisAncestry + '.' + index;
                        }
                        thatColumn.attr('data-ancestry', columnAncestry);
                    }
                    //Update the index of each item
                    child.attr('data-index', index);
                });
            });
        },
        //Method to splice in items
        spliceIn: function (options) {
            var objectToSplice = options.spliceMe;
            var objectToInject = options.injectMe;
            var newWeight = options.newWeight;
            var oldWeight = options.oldWeight;
            var deleteFrom = options.deleteFrom || null;
            var that = this;
            //Splice the injected element into the object at it's new position
            objectToSplice.children.splice(newWeight, 0, objectToInject);

            //Remove the spliced in object
            if (deleteFrom) {
                deleteFrom.children.splice(oldWeight, 1);
            } else if (newWeight < oldWeight) {
                //If the object was spliced in below it's new weight increment remove by 1
                oldWeight++;
                objectToSplice.children.splice(oldWeight, 1);
            } else {
                objectToSplice.children.splice(oldWeight, 1);
            }
            that.reIndex(objectToSplice);
        },
        //get ancestors of clicked item based on this ancestry
        getFamily: function (info) {
            var that = this;
            var indexArray = info.index.split('.');
            var id = info.nid;
            var label = info.title;
            var thisItem = that.newCurriculum;
            var update = info.update || false;
            //if you need root family
            if (info.index !== 'root') {
                //loop through ancestry array
                for (var i = 0, l = indexArray.length; i < l; i++) {
                    if (!thisItem.children) {
                        thisItem.children = [];
                    }
                    if (!thisItem.children[indexArray[i]]) {
                        thisItem.children.push(
                            {
                                children: [],
                                label: label,
                                nid: null
                            }
                        );
                    }
                    thisItem = thisItem.children[indexArray[i]];
                }
            }

            if (update) {
                thisItem.label = label;
                thisItem.nid = id;
            }
            if (!thisItem.children) {
                thisItem.children = [];
            }
            return thisItem;
        },
        newCurriculum : {
            "nid":"210",
            "label":"Demo Curriculum",
            "children":[
                {
                    "nid":"211",
                    "bundle":"course_module",
                    "label":"Modules",
                    "weight":0,
                    "children":[
                        {
                            "nid":"212",
                            "bundle":"course_module",
                            "label":"Module 1",
                            "weight":0,
                            "children":[
                                {
                                    "nid":"213",
                                    "bundle":"course_module",
                                    "label":"Section 1",
                                    "weight":0,
                                    "children":[
                                        {
                                            "nid":"214",
                                            "bundle":"video",
                                            "label":"First Video",
                                            "weight":0
                                        },
                                        {
                                            "nid":"215",
                                            "bundle":"audio",
                                            "label":"First Audio",
                                            "weight":1
                                        },
                                        {
                                            "nid":"216",
                                            "bundle":"video",
                                            "label":"Hello World!",
                                            "weight":2
                                        },
                                        {
                                            "nid":"482",
                                            "bundle":"video",
                                            "label":"Welcome",
                                            "weight":3
                                        }
                                    ]
                                },
                                {
                                    "nid":"218",
                                    "bundle":"course_module",
                                    "label":"Section 2",
                                    "weight":1,
                                    "children":[
                                        {
                                            "nid":"220",
                                            "bundle":"video",
                                            "label":"Second Video",
                                            "weight":0
                                        },
                                        {
                                            "nid":"221",
                                            "bundle":"video",
                                            "label":"Second Hello World!",
                                            "weight":1
                                        },
                                        {
                                            "nid":"225",
                                            "bundle":"audio",
                                            "label":"Third Audio",
                                            "weight":2
                                        },
                                        {
                                            "nid":"330",
                                            "bundle":"webform_quiz",
                                            "label":"Quiz #1",
                                            "weight":3
                                        }
                                    ]
                                },
                                {
                                    "nid":"222",
                                    "bundle":"video",
                                    "label":"Orphan Video",
                                    "weight":2
                                },
                                {
                                    "nid":"223",
                                    "bundle":"audio",
                                    "label":"Orphan Audio",
                                    "weight":3
                                },
                                {
                                    "nid":"224",
                                    "bundle":"course_module",
                                    "label":"Section 3",
                                    "weight":4,
                                    "children":[
                                        {
                                            "nid":"219",
                                            "bundle":"audio",
                                            "label":"Second Audio",
                                            "weight":0
                                        },
                                        {
                                            "nid":"226",
                                            "bundle":"video",
                                            "label":"Third Hello World!",
                                            "weight":1
                                        },
                                        {
                                            "nid":"227",
                                            "bundle":"video",
                                            "label":"Third Video",
                                            "weight":2
                                        },
                                        {
                                            "nid":"329",
                                            "bundle":"slides",
                                            "label":"First PDF Thing",
                                            "weight":3
                                        }
                                    ]
                                },
                                {
                                    "nid":"410",
                                    "bundle":"discussion_topic",
                                    "label":"Last Discussion",
                                    "weight":5
                                },
                                {
                                    "nid":"413",
                                    "bundle":"slides",
                                    "label":"Another PDF",
                                    "weight":6
                                },
                                {
                                    "nid":"452",
                                    "bundle":"checklist",
                                    "label":"Take a Photo",
                                    "weight":7
                                }
                            ]
                        },
                        {
                            "nid":"331",
                            "bundle":"course_module",
                            "label":"Module 2",
                            "weight":1,
                            "children":[
                                {
                                    "nid":"332",
                                    "bundle":"checklist",
                                    "label":"Second Checklist",
                                    "weight":0
                                },
                                {
                                    "nid":"348",
                                    "bundle":"video",
                                    "label":"Media Length",
                                    "weight":1
                                },
                                {
                                    "nid":"407",
                                    "bundle":"video",
                                    "label":"Vid with media lenght",
                                    "weight":2
                                },
                                {
                                    "nid":"408",
                                    "bundle":"slides",
                                    "label":"One more PDF",
                                    "weight":3
                                },
                                {
                                    "nid":"447",
                                    "bundle":"audio",
                                    "label":"Test Audio - meditation break",
                                    "weight":4
                                },
                                {
                                    "nid":"469",
                                    "bundle":"seminar",
                                    "label":"fulfillment ACT",
                                    "weight":5
                                }
                            ]
                        },
                        {
                            "nid":"453",
                            "bundle":"webform_test",
                            "label":"Test 1",
                            "weight":2
                        },
                        {
                            "nid":"466",
                            "bundle":"seminar",
                            "label":"First ACT",
                            "weight":3
                        },
                        {
                            "nid":"483",
                            "bundle":"course_module",
                            "label":"Module 4",
                            "weight":4,
                            "children":[
                                {
                                    "nid":"484",
                                    "bundle":"video",
                                    "label":"Welcome Video",
                                    "weight":0
                                }
                            ]
                        },
                        {
                            "nid":"487",
                            "bundle":"course_module",
                            "label":"Module 3",
                            "weight":5,
                            "children":[
                                {
                                    "nid":"488",
                                    "bundle":"course_module",
                                    "label":"Welcome ",
                                    "weight":0,
                                    "children":[
                                        {
                                            "nid":"491",
                                            "bundle":"video",
                                            "label":"Welcome",
                                            "weight":0
                                        },
                                        {
                                            "nid":"493",
                                            "bundle":"slides",
                                            "label":"Welcome slides",
                                            "weight":1
                                        },
                                        {
                                            "nid":"494",
                                            "bundle":"video",
                                            "label":"Keynote",
                                            "weight":2
                                        },
                                        {
                                            "nid":"495",
                                            "bundle":"slides",
                                            "label":"Keynote slides",
                                            "weight":3
                                        },
                                        {
                                            "nid":"496",
                                            "bundle":"video",
                                            "label":"Mission",
                                            "weight":4
                                        },
                                        {
                                            "nid":"497",
                                            "bundle":"slides",
                                            "label":"Mission slides",
                                            "weight":5
                                        },
                                        {
                                            "nid":"498",
                                            "bundle":"slides",
                                            "label":"IIN Mission Statement",
                                            "weight":6
                                        },
                                        {
                                            "nid":"499",
                                            "bundle":"audio",
                                            "label":"The Color Red and Spirals",
                                            "weight":7
                                        },
                                        {
                                            "nid":"500",
                                            "bundle":"slides",
                                            "label":"The Color Red and Spirals Slides",
                                            "weight":8
                                        }
                                    ]
                                },
                                {
                                    "nid":"489",
                                    "bundle":"course_module",
                                    "label":"Curriculum Overview",
                                    "weight":1,
                                    "children":[
                                        {
                                            "nid":"501",
                                            "bundle":"video",
                                            "label":"Curriculum overview ",
                                            "weight":0
                                        },
                                        {
                                            "nid":"503",
                                            "bundle":"video",
                                            "label":"The Golden Path",
                                            "weight":1
                                        },
                                        {
                                            "nid":"504",
                                            "bundle":"slides",
                                            "label":"The Golden Path Step 1",
                                            "weight":2
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "nid":"606",
                            "bundle":"webform_test",
                            "label":"Test",
                            "weight":6
                        }
                    ]
                },
                {
                    "nid":"349",
                    "bundle":"webform_assignment",
                    "label":"Health History",
                    "weight":1
                },
                {
                    "nid":"420",
                    "bundle":"course_module",
                    "label":"CC",
                    "weight":2,
                    "children":[
                        {
                            "nid":"470",
                            "bundle":"course_module",
                            "label":"CC Container",
                            "weight":0,
                            "children":[
                                {
                                    "nid":"421",
                                    "bundle":"seminar",
                                    "label":"Marc - Test CC",
                                    "weight":0
                                },
                                {
                                    "nid":"467",
                                    "bundle":"seminar",
                                    "label":"Second ACT",
                                    "weight":1
                                },
                                {
                                    "nid":"468",
                                    "bundle":"seminar",
                                    "label":"Third ACT",
                                    "weight":2
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    };

    nestedColumns.init();
})();