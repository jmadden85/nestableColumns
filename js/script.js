(function () {
    var nestedColumns = {
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
                that.addItem($(this).parents().siblings('ul'));
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
            var itemColumn = $(item).parent().attr('data-colNum');
            var thisItemTitle = $(item).children('h3').html();
            var newAncestry = $(item).parent().attr('data-ancestry');
            var newParent;

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
            if (newAncestry !== 'root') {
                newAncestry += '.' + thisIndex;
            } else {
                newAncestry = thisIndex;
            }
            newParent = that.getAncestry(newAncestry);
            newFamily = that.getFamily({
                index: newAncestry,
                nid: thisId
            });
            console.log(newFamily);
            //display next container
            this.showChildContainer(newParent, itemColumn, thisItemTitle, newAncestry);
        },
        //method to show new container
        showChildContainer : function (item, column, title, ancestry) {
            //set new column number to current column + 1
            var newCol = +column + 1;
            var that = this;

            //Create and append new container
            var newColContainer = $('<section class="colWrapper"></section>');
            newColContainer.appendTo('.nestableWrapper');

            //add header to this column
            $('<header>' +
                '<span class="sectionTitle">Modules</span>' +
                '<div class="addItem">+</div>' +
                '</header>'
            ).appendTo(newColContainer);

            //create column add attributes
            $('<ul/>', {
                    'class': 'column',
                    'data-colNum': newCol,
                    'data-ancestry': ancestry
            }).appendTo(newColContainer);
            var thisColumn = $('[data-colNum="' + newCol + '"]');

            //get clicked item children and build list items from them
            for (var i in item.children) {
                var title = item.children[i].title;
                var id = item.children[i].id;
                var ancestry = item.children[i].ancestry;
                $('<li class="item" data-id="' + id + '">' +
                    '<h3>' + title + '</h3>' +
                    '</li>' +
                    '<li class="slot"></li>'
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
        },
        //method to add new item
        addItem : function (el) {
            var that = this;
            var curr = that.curriculum;

            //increment next node by 1
            curr.nextNode++;

            //append the new item
            $('<li><input type="text" draggable="true"></li>')
                .addClass('item')
                .attr('data-id', curr.nextNode)
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
                        $('<h3>' + $(this).val() + '</h3>').appendTo($(this).parent());
                        $(this).remove();
                    }
                });

            //append new spacer
            $('<li class="slot"></li>').appendTo(el);
        },
        dragSet : function () {
            var dragUnset = document.querySelectorAll('[dragUnsetItem]');
            var dragUnsetSlot = document.querySelectorAll('[dragUnsetSlot]');
            var dragSrcEl = null;

            //Drag start handler
            var dragStartHandler = function (e) {
                this.setAttribute('dragging', true);
                dragSrcEl = this;
                console.log(dragSrcEl);
                e.dataTransfer.effectAllowed = 'move';
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
            };

            //drop handler
            var dropHandler = function (e) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }

                if (dragSrcEl !== this) {
                    // Set the source column's HTML to the HTML of the column we dropped on.
                    dragSrcEl.innerHTML = this.innerHTML;
                    this.innerHTML = e.dataTransfer.getData('text/html');
                    //remove unneccessary meta tag
                    this.querySelector('meta').remove();
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
        //get ancestors of clicked item based on this ancestry
        getFamily: function (info) {
            var that = this;
            var indexArray = info.index.split('.');
            var id = info.nid;
            var curr = that.newCurriculum;
            var thisItem = curr;
            //loop through ancestry array
            for (var i = 0, l = indexArray.length; i < l; i++) {
                if (!thisItem.children[indexArray[i]]) {
                    thisItem.children.push(
                        {}
                    );
                }
                thisItem = thisItem.children[indexArray[i]];
            }
            return thisItem;
        },
        getAncestry : function (ancestry) {
            var that = this;
            var curr = that.curriculum;
            var ancestorArray = ancestry.split('.');
            var thisItem = curr;

            //loop through ancestry array
            for (var i = 0, l = ancestorArray.length; i < l; i++) {
                if (!thisItem[ancestorArray[i]]) {
                    thisItem[ancestorArray[i]] = {};
                }
                thisItem = thisItem[ancestorArray[i]];
            }
            return thisItem;
        },
        curriculum : {
            nextNode : 15,
            1 : {
                children : {
                    6 : {
                        title : 'testing',
                        id : 6,
                        ancestry : '1',
                        children : {}
                    },
                    7 : {
                        title : 'abcdefg',
                        id : 7,
                        ancestry : '1',
                        children : {}
                    }
                }
            },
            2 : {
                children : {
                    8 : {
                        title : 'arggg',
                        id : 8,
                        ancestry : '2',
                        children : {}
                    },
                    9 : {
                        title : 'garggg',
                        id : 9,
                        ancestry : '2',
                        children : {}
                    }
                }
            },
            3 : {
                children : {
                    10 : {
                        title : 'adsfaewf',
                        id : 10,
                        ancestry : '3',
                        children : {}
                    },
                    11 : {
                        title : '233233',
                        id : 11,
                        ancestry : '3',
                        children : {}
                    }
                }
            },
            4 : {
                children : {
                    12 : {
                        title : '222',
                        id : 12,
                        ancestry : '4',
                        children : {}
                    },
                    13 : {
                        title : 'ddd',
                        id : 13,
                        ancestry : '4',
                        children : {}
                    }
                }
            },
            5 : {
                children : {
                    14 : {
                        title : 'abc',
                        id : 14,
                        ancestry : '5',
                        children : {}
                    },
                    15 : {
                        title : '453',
                        id : 15,
                        ancestry : '5',
                        children : {}
                    }
                }
            }
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