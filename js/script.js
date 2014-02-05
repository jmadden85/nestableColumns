'use strict';
(function () {
    var nestedColumns = {
        dragSrc : {

        },
        init : function () {
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

            //init dragging code
            that.dragSet();
        },
        //method to build initial view
        buildFirstView : function (curriculum) {
            //base class array
            var mainColumn = $('#mainCol');
            var baseClasses = curriculum.children;
            var baseClassLabels = $();
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
        select : function (item) {
            var that = this;
            var thisId = $(item).find('h3').attr('data-nid');
            var thisIndex = $(item).find('h3').attr('data-index');
            var thisItemTitle = $(item).children('h3').html();
            var thisAncestry = $(item).parent().attr('data-ancestry');
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

            //add active class to this item
            $(item).addClass('active');

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
            this.showChildContainer(newFamily, thisAncestry, thisItemTitle);
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
        addItem : function (el) {
            var that = this;

            //append the new item
            $('<li draggable="true" dragUnsetItem="true"><input type="text"></li>')
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
                        $('<h3 data-nid="null" data-index="' + ($(this).parent().index() - 1) / 2 + '">' + $(this).val() + '</h3>').appendTo($(this).parent());
                        var thisAncestry;
                        if ($(this).parents('ul').attr('data-ancestry') === 'root') {
                            thisAncestry = ($(this).parent().index() - 1) / 2;
                        } else {
                            thisAncestry = $(this).parents('ul').attr('data-ancestry') + '.' + ($(this).parent().index() - 1) / 2;
                        }
                        that.getFamily({
                            index: thisAncestry.toString(),
                            title: $(this).val(),
                            id : null,
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
            var newIndex = (el.children().last().index() - 1) / 2;
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
        },
        dragSet : function () {
            var dragUnset = document.querySelectorAll('[dragUnsetItem]');
            var dragUnsetSlot = document.querySelectorAll('[dragUnsetSlot]');
            var dragSrcEl = null;
            var that = this;
            var dragElInfo;
            var dropElInfo;

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
                    elInfo.push(that.newCurriculum);
                }

                return elInfo;
            };

            //Drag start handler
            var dragStartHandler = function (e) {
                this.setAttribute('dragging', true);
                that.dragSrc = this;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('json', JSON.stringify(dragInfo(this, 'drag')));
                e.dataTransfer.setData('text/html', this.innerHTML);
                console.log(that.newCurriculum.children[0].children[0].label);
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
                    console.log(deleteFrom);
                    //if you dropped it on an empty slot, get the family of the parent element
                    if (!this.childNodes.length) {
                        targetFamily = that.getFamily({
                            index: this.parentNode.getAttribute('data-ancestry'),
                            id: this.parentNode.getAttribute('data-nid'),
                            label: null
                        });
                        //Splice this new arrangement into the curriculum object
                        var newWeight = $(this).index() / 2;
                        that.spliceIn({
                            spliceMe: targetFamily,
                            injectMe: droppedFamily[1],
                            newWeight: newWeight,
                            oldWeight: parseInt(droppedFamily[0].weight, 10)
                        });
                    } else {
                        targetFamily = dragInfo(this, 'drop');
                        if (!targetFamily[1].children) {
                            targetFamily[1].children = [];
                        }
                        that.spliceIn({
                            spliceMe: targetFamily[1],
                            injectMe: droppedFamily[1],
                            newWeight: targetFamily[1].children.length,
                            oldWeight: parseInt(droppedFamily[0].weight, 10),
                            deleteFrom: deleteFrom
                        });
                    }


                }
                console.log(that.newCurriculum.children[0].children[0].label);

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