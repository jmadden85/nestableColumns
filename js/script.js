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
            var weight = info.weight;
            var nid = info.nid;
            var label = info.label;
            var parent = info.parent;
            var that = this;
            that.changedItems[nid] = {
                weight: weight,
                nid: nid,
                label: label,
                parent: parent
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
                            nid : that.newNodes,
                            update: true
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
            console.log(that.changedItems);
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
                    console.log(that.currChange);
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
                        //if the column you drop on is opened append it to the end, otherwise just reove it
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
                that.reIndex();
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
        reIndex: function () {
            var columns = $('.column');
            //Loop through the columns
            $.each(columns, function (index, value) {
                //Loop through the items in each column
                $.each($(value).children('.item'), function (index, value) {
                    var that = $(this);
                    var child = $(that.children('h3'));
                    //If the item is active fix the ancestry for the it's open column
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
            console.log(options);
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
        },
        //get ancestors of clicked item based on this ancestry
        getFamily: function (info) {
            var that = this;
            var indexArray = info.index.split('.');
            var id = info.nid;
            var label = info.title;
            var thisItem = that.newCurriculum;
            var update = info.update || false;
            console.log(info);
            //if you need root family
            if (info.index !== 'root') {
                //loop through ancestry array
                for (var i = 0, l = indexArray.length; i < l; i++) {
                    console.log(thisItem);
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
                    "label":"Modules",
                    "children":[
                        {
                            "nid":"212",
                            "label":"Module 1",
                            "children":[
                                {
                                    "nid":"213",
                                    "label":"Section 1",
                                    "children":[
                                        {
                                            "nid":"214",
                                            "label":"First Video"
                                        },
                                        {
                                            "nid":"215",
                                            "label":"First Audio"
                                        },
                                        {
                                            "nid":"216",
                                            "label":"Hello World!"
                                        },
                                        {
                                            "nid":"482",
                                            "label":"Welcome"
                                        }
                                    ]
                                },
                                {
                                    "nid":"218",
                                    "label":"Section 2",
                                    "children":[
                                        {
                                            "nid":"220",
                                            "label":"Second Video"
                                        },
                                        {
                                            "nid":"221",
                                            "label":"Second Hello World!"
                                        },
                                        {
                                            "nid":"225",
                                            "label":"Third Audio"
                                        },
                                        {
                                            "nid":"330",
                                            "label":"Quiz #1"
                                        }
                                    ]
                                },
                                {
                                    "nid":"222",
                                    "label":"Orphan Video"
                                },
                                {
                                    "nid":"223",
                                    "label":"Orphan Audio"
                                },
                                {
                                    "nid":"224",
                                    "label":"Section 3",
                                    "children":[
                                        {
                                            "nid":"219",
                                            "label":"Second Audio"
                                        },
                                        {
                                            "nid":"226",
                                            "label":"Third Hello World!"
                                        },
                                        {
                                            "nid":"227",
                                            "label":"Third Video"
                                        },
                                        {
                                            "nid":"329",
                                            "label":"First PDF Thing"
                                        }
                                    ]
                                },
                                {
                                    "nid":"410",
                                    "label":"Last Discussion"
                                },
                                {
                                    "nid":"413",
                                    "label":"Another PDF"
                                },
                                {
                                    "nid":"452",
                                    "label":"Take a Photo"
                                }
                            ]
                        },
                        {
                            "nid":"331",
                            "label":"Module 2",
                            "children":[
                                {
                                    "nid":"332",
                                    "label":"Second Checklist"
                                },
                                {
                                    "nid":"348",
                                    "label":"Media Length"
                                },
                                {
                                    "nid":"407",
                                    "label":"Vid with media lenght"
                                },
                                {
                                    "nid":"408",
                                    "label":"One more PDF"
                                },
                                {
                                    "nid":"447",
                                    "label":"Test Audio - meditation break"
                                },
                                {
                                    "nid":"469",
                                    "label":"fulfillment ACT"
                                }
                            ]
                        },
                        {
                            "nid":"453",
                            "label":"Test 1"
                        },
                        {
                            "nid":"466",
                            "label":"First ACT"
                        },
                        {
                            "nid":"483",
                            "label":"Module 4",
                            "children":[
                                {
                                    "nid":"484",
                                    "label":"Welcome Video"
                                }
                            ]
                        },
                        {
                            "nid":"487",
                            "label":"Module 3",
                            "children":[
                                {
                                    "nid":"488",
                                    "label":"Welcome ",
                                    "children":[
                                        {
                                            "nid":"491",
                                            "label":"Welcome"
                                        },
                                        {
                                            "nid":"493",
                                            "label":"Welcome slides"
                                        },
                                        {
                                            "nid":"494",
                                            "label":"Keynote"
                                        },
                                        {
                                            "nid":"495",
                                            "label":"Keynote slides"
                                        },
                                        {
                                            "nid":"496",
                                            "label":"Mission"
                                        },
                                        {
                                            "nid":"497",
                                            "label":"Mission slides"
                                        },
                                        {
                                            "nid":"498",
                                            "label":"IIN Mission Statement"
                                        },
                                        {
                                            "nid":"499",
                                            "label":"The Color Red and Spirals"
                                        },
                                        {
                                            "nid":"500",
                                            "label":"The Color Red and Spirals Slides"
                                        }
                                    ]
                                },
                                {
                                    "nid":"489",
                                    "label":"Curriculum Overview",
                                    "children":[
                                        {
                                            "nid":"501",
                                            "label":"Curriculum overview "
                                        },
                                        {
                                            "nid":"503",
                                            "label":"The Golden Path"
                                        },
                                        {
                                            "nid":"504",
                                            "label":"The Golden Path Step 1"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "nid":"606",
                            "label":"Test"
                        }
                    ]
                },
                {
                    "nid":"349",
                    "label":"Health History"
                },
                {
                    "nid":"420",
                    "label":"CC",
                    "children":[
                        {
                            "nid":"470",
                            "label":"CC Container",
                            "children":[
                                {
                                    "nid":"421",
                                    "label":"Marc - Test CC"
                                },
                                {
                                    "nid":"467",
                                    "label":"Second ACT"
                                },
                                {
                                    "nid":"468",
                                    "label":"Third ACT"
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