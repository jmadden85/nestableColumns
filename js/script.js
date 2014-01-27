(function () {
    var nestedColumns = {
        init : function () {
            //store this as that
            var that = this;
            //Set click event on all items
            $('.item').click(function () {
                that.select(this);
            });
            $('.addItem').click(function () {
                that.addItem($(this).parents('ul'));
            });
        },
        //method for selecting an element
        select : function (item) {
            var that = this;
            var curr = that.curriculum;
            var thisId = $(item).attr('data-id');
            var itemColumn = $(item).parent().attr('data-colNum');
            var itemAncestry = $(item).attr('data-ancestry') || null;
            var thisItem = curr[thisId];
            var thisItemTitle = $(item).children('h3').html();
            var itemParent;

            //check if this item is active
            //if it is do nothing
            if ($(item).hasClass('active')) {
                return false;
            //if it isn't active remove other columns after this one
            } else if ($(item).siblings().hasClass('active')) {
                $('[data-colNum="' + itemColumn + '"] ~ ul').remove();
            }
            //remove active class from all siblings
            $(item).siblings().removeClass('active');
            //add active class to this item
            $(item).addClass('active');

            //Check if the selected item has a ancestors
            if (itemAncestry) {
                //Set item parent to the correct object based on ancestry
                itemParent = that.getAncestry(itemAncestry);
                thisItem = itemParent[thisId];
            }
            //check if object has been defined or not yet
            //and define it
            if (!thisItem && !itemParent) {
                curr[thisId] = {};
                thisItem = curr[thisId];
            } else if (!thisItem && itemParent) {
                itemParent[thisId] = {};
                thisItem = itemParent[thisId];
            }
            //display next container
            this.showChildContainer(thisItem, itemColumn, thisItemTitle);
        },
        //function to show new container
        showChildContainer : function (item, column, title) {
            //set new column number to current column + 1
            var newCol = +column + 1;
            var that = this;
            //create column add attributes
            $('<ul/>', {
                    'class': 'column',
                    'data-colNum': newCol
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
                $('<li class="item" data-ancestry="' + ancestry + '" data-id="' + id + '">' +
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
            console.log(el.attr('data-colnum'));
        },
        //get ancestors of clicked item based on this ancestry
        getAncestry : function (ancestry) {
            var that = this;
            var curr = that.curriculum;
            var ancestorArray = ancestry.split('.');
            var thisItem = curr;
            //loop through ancestry array
            for (var i = 0, l = ancestorArray.length; i < l; i++) {
                thisItem = thisItem[ancestorArray[i]];
            }
            return thisItem;
        },
        curriculum : {
            1 : {
                children : {
                    22 : {
                        title : 'testing',
                        id : 22,
                        ancestry : '1',
                        children : {}
                    },
                    40 : {
                        title : 'abcdefg',
                        id : 40,
                        ancestry : '1',
                        children : {}
                    }
                }
            },
            2 : {
                children : {
                    22 : {
                        title : 'arggg',
                        id : 22,
                        ancestry : '2',
                        children : {}
                    },
                    40 : {
                        title : 'garggg',
                        id : 40,
                        ancestry : '2',
                        children : {}
                    }
                }
            },
            3 : {
                children : {
                    22 : {
                        title : 'adsfaewf',
                        id : 22,
                        ancestry : '3',
                        children : {}
                    },
                    40 : {
                        title : '233233',
                        id : 40,
                        ancestry : '3',
                        children : {}
                    }
                }
            },
            4 : {
                children : {
                    22 : {
                        title : '222',
                        id : 22,
                        ancestry : '4',
                        children : {}
                    },
                    40 : {
                        title : 'ddd',
                        id : 40,
                        ancestry : '4',
                        children : {}
                    }
                }
            },
            5 : {
                children : {
                    22 : {
                        title : 'abc',
                        id : 22,
                        ancestry : '5',
                        children : {}
                    },
                    40 : {
                        title : '453',
                        id : 40,
                        ancestry : '5',
                        children : {}
                    }
                }
            }
        }
    };

    nestedColumns.init();
})();