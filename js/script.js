(function () {
    var nestedColumns = {
        init : function () {
            //store this as that
            var that = this;
            //Set click event on all items
            $('.item').click(function () {
                that.select(this);
            });
            //add the add item functionality
            $('.addItem').click(function () {
                that.addItem($(this).parents('ul'));
            });
            //init dragging code
            that.dragSet();
        },
        //method for selecting an element
        select : function (item) {
            var that = this;
            var thisId = $(item).attr('data-id');
            var itemColumn = $(item).parent().attr('data-colNum');
            var thisItemTitle = $(item).children('h3').html();
            var newAncestry = $(item).parent().attr('data-ancestry');
            var newParent;

            //check if this item is active
            //if it is do nothing
            if ($(item).hasClass('active') || !thisItemTitle) {
                return false;
            //if it isn't active remove other columns after this one
            } else if ($(item).siblings().hasClass('active')) {
                $('[data-colNum="' + itemColumn + '"] ~ ul').remove();
            }
            //remove active class from all siblings
            $(item).siblings().removeClass('active');
            //add active class to this item
            $(item).addClass('active');
            //Check if this is the root column
            //if not add to the ancestry
            //else make this ancestry equal to clicked item
            if (newAncestry !== 'root') {
                newAncestry += '.' + thisId;
            } else {
                newAncestry = thisId;
            }
            newParent = that.getAncestry(newAncestry);
            //display next container
            this.showChildContainer(newParent, itemColumn, thisItemTitle, newAncestry);
        },
        //method to show new container
        showChildContainer : function (item, column, title, ancestry) {
            //set new column number to current column + 1
            var newCol = +column + 1;
            var that = this;
            //create column add attributes
            $('<ul/>', {
                    'class': 'column',
                    'data-colNum': newCol,
                    'data-ancestry': ancestry
            }).appendTo('.nestableWrapper');
            var thisColumn = $('[data-colNum="' + newCol + '"]');
            //add header to this column
            $('<li class="head">' +
                '<span id="sectionTitle">Modules</span>' +
                '<div class="addItem">+</div>' +
                '</li>').appendTo(thisColumn);
            //get clicked item children and build list items from them
            for (var i in item.children) {
                var title = item.children[i].title;
                var id = item.children[i].id;
                var ancestry = item.children[i].ancestry;
                $('<li class="item" data-id="' + id + '">' +
                    '<h3>' + title + '</h3>' +
                '</li>').appendTo('[data-colNum="' + newCol + '"]');
            }
            //add select method to all new items
            //add add item method to new column
            var thisColumnItems = thisColumn.find('.item');
            thisColumnItems.click(function () {
                that.select(this);
            });
            thisColumn.find('.addItem').click(function () {
                that.addItem($(this).parents('ul'));
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
        },
        dragSet : function () {
            var dragUnset = document.querySelectorAll('[dragUnset]');
            var maskHeight = document.querySelector('.item').scrollHeight;
            var maskWidth = document.querySelector('.item').scrollWidth;
            var dragSrcEl = null;
            var dragStartHandler = function (e) {
                this.setAttribute('dragging', true);
                dragSrcEl = this;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', this.innerHTML);
            };
            var dragOverHandler = function (e) {
                if (e.preventDefault) {
                    e.preventDefault();
                }

                e.dataTransfer.dropEffect = 'move';

                return false;
            };
            var dragEnterHandler = function (e) {
                if (this.getAttribute('dragging')) {
                    return false;
                }

                this.children[0].classList.add('over');
            };
            var dragLeaveHandler = function (e) {
                this.children[0].classList.remove('over');
            };
            var dragEndHandler = function (e) {
                document.querySelector('.over').classList.remove('over');
                document.querySelector('[dragging]').removeAttribute('dragging');
            };
            var dropHandler = function (e) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }

                if (dragSrcEl !== this) {
                    // Set the source column's HTML to the HTML of the column we dropped on.
                    dragSrcEl.innerHTML = this.innerHTML;
                    this.innerHTML = e.dataTransfer.getData('text/html');
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
                el.removeAttribute('dragUnset');
            });
        },
        //get ancestors of clicked item based on this ancestry
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
        }
    };

    nestedColumns.init();
})();