(function () {
    var nestedColumns = {
        init : function () {
            var that = this;
            $('.item').click(function () {
                that.select(this);
            });
        },
        select : function (item) {
            var curr = this.curriculum;
            var thisId = $(item).attr('data-id');
            var itemColumn = $(item).parent().attr('data-colNum');
            var itemAncestry = $(item).attr('data-ancestry') || null;
            var thisItem = curr[thisId];
            var thisItemTitle = $(item).children('h3').html();
            var itemParent;

            if ($(item).hasClass('active')) {
                return false;
            } else if ($(item).siblings().hasClass('active')) {
                //go through other columns and remove them
            }

            $(item).siblings().removeClass('active');
            $(item).addClass('active');

            //Check if the selected item has a ancestors
            if (itemAncestry) {
                //Set item parent to the correct object based on ancestry
                itemParent = this.getAncestry(itemAncestry);
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
            console.log(curr);
            this.showChildContainer(thisItem, itemColumn, thisItemTitle);
        },
        showChildContainer : function (children, column, title) {
            var newCol = +column + 1;
            var select = this.select;
            $("<ul/>", {
                    "class": "column",
                    "data-colNum": newCol
            }).appendTo('.nestableWrapper');
            for (var i in children) {
                var title = children[i].title;
                var id = children[i].id;
                var ancestry = children[i].ancestry;
                $('<li class="item" data-ancestry="' + ancestry + '" data-id="' + id + '">' +
                    '<h3>' + title + '</h3>' +
                    '</li>').appendTo('[data-colNum="' + newCol + '"]');
            }
            $('[data-colNum="' + newCol + '"] li').click(function () {
                select(this)
            });
        },
        getAncestry : function (ancestry) {
            var curr = this.curriculum;
            var ancestorArray = ancestry.split('.');
            var thisItem = curr;
            for (var i = 0, l = ancestorArray.length; i < l; i++) {
                thisItem = thisItem[i];
            }
            return thisItem;
        },
        curriculum : {
            1 : {
                22 : {
                    title : 'testing',
                    id : 22,
                    ancestry : '1'
                },
                40 : {
                    title : 'abcdefg',
                    id : 40,
                    ancestry : '1'
                }
            },
            2 : {
                22 : {
                    title : 'testing',
                    id : 22,
                    ancestry : '1'
                },
                40 : {
                    title : 'abcdefg',
                    id : 40,
                    ancestry : '2'
                }
            },
            3 : {
                22 : {
                    title : 'testing',
                    id : 22,
                    ancestry : '1'
                },
                40 : {
                    title : 'abcdefg',
                    id : 40,
                    ancestry : '3'
                }
            },
            4 : {
                22 : {
                    title : 'testing',
                    id : 22,
                    ancestry : '1'
                },
                40 : {
                    title : 'abcdefg',
                    id : 40,
                    ancestry : '4'
                }
            },
            5 : {
                22 : {
                    title : 'testing',
                    id : 22,
                    ancestry : '1'
                },
                40 : {
                    title : 'abcdefg',
                    id : 40,
                    ancestry : '5'
                }
            }
        }
    };

    nestedColumns.init();
})();