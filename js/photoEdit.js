/**
 * 画布内图片设定，宽高较长一方为 400px
 */
$(document).ready(function(){
    var canvas = new Canvas(),
        progress_bar = new ProgressBar();

    canvas.initCanvas();
    progress_bar.bind_fn();

    $(document).on({
        dragleave:function(e){    //拖离
            e.preventDefault();
        },
        drop:function(e){  //拖后放
            e.preventDefault();
        },
        dragenter:function(e){    //拖进
            e.preventDefault();
        },
        dragover:function(e){    //拖来拖去
            e.preventDefault();
        },
        dragstart:function(e){
            e.preventDefault();
        },
        drag:function(e){
            e.preventDefault();
        }
    });

    $(".thumb-wrap").on("mousedown",".thumb-img img",function(e){
        e.preventDefault();
        e.stopPropagation();
        if(!canvas.isAdd){
            $("#canvas .textNode").addClass("event").removeClass("blur");
            canvas.isAdd = true;
            canvas.targetJson = $(this).attr("data-json") || "127035184";
            var src = $(this).attr("src");
            $(".moveDiv").find("img").attr("src",src).end().css({"display":"block","left": mousePosition(e).x-10,"top":mousePosition(e).y-10});
        }
    });

    $(".image-select").on("click","div",function(){
        $("#canvas .active img").attr("src",$(this).attr("data-src"));
        $(this).parent().addClass("active").siblings("li").removeClass("active");
    });
    $(".fit-item").click(function(){
        fixImage($("#canvas .active"));
        $(".contextMenu").css({top:0,left:0}).hide();
    });
    $(".remove-item").click(function(){
        $("#canvas .active").find("img").remove().end().find(".text").show().end().removeClass("active").removeClass("insert");
        canvas.hideToobar();
        $(".contextMenu").css({top:0,left:0}).hide();
    });
    $(".horizontal-item").click(function(){
        var item = $("#canvas .active img"),
            _style = $browser.getBrowserStyle("transform");
        setMatrix(item,_style,"horizontal");
        $(".contextMenu").css({top:0,left:0}).hide();
    });
    $(".vertical-item").click(function(){
        var item = $("#canvas .active img"),
            _style = $browser.getBrowserStyle("transform");
        setMatrix(item,_style,"vertical");
        $(".contextMenu").css({top:0,left:0}).hide();
    });

});

function Canvas(){
    this.BASE_JSON = {};
    this.BASE_HEIGHT = 0;
    this.CUR_HEIGHT = 0;
    this.MOVE_SRC = "";
    this.isAdd = false;
    this.targetJson = "";
    this.bind_fn();
}
Canvas.prototype.initCanvas = function(){
    var _h = $(window).height();
    $("#aside .thumbs").height(_h-115);
    $("#controller").height(_h-34);
    this.getTemple("js/display.json");
};
Canvas.prototype.setCanvas = function(data){
    this.BASE_HEIGHT = data.base_height;
    this.CUR_HEIGHT = $("#controller").height();
    var per = this.CUR_HEIGHT/this.BASE_HEIGHT;
    $("#canvas").html("");
    for(var i in data.canvas){
        if(data.canvas[i].type == "image"){
            $("#canvas").append(buildImgNode(data.canvas[i],per));
        }else if(data.canvas[i].type == "text"){
            $("#canvas").append(buildTxtNode(data.canvas[i],per));
        }
    }
};
Canvas.prototype.getTemple = function(str){
    var _this = this;
    $.ajax({
        url : str,
        dataType : "json"
    })
        .done(function(data){
            _this.setCanvas(data);
        })
};
Canvas.prototype.bind_fn = function(){
    var _this = this;
    var moving = false;
    var _dragSrc = "", _dragDom = null, mouseX= 0, mouseY=0;
    $("#canvas").on("mousedown",".textNode",function(e){
        e.preventDefault();
        mouseX = mousePosition(e).x;
        mouseY = mousePosition(e).y;
        moving = true;
        _dragDom = $(this);
        if($(this).find("img").length>0){
            $("#canvas .insert").addClass("blur").removeClass("active");
            $(this).addClass("insert").removeClass("blur").addClass("active");
            _this.initToobar($(this).find("img").attr("data-json"));
            _dragSrc = $(this).find("img").attr("src");
            _this.MOVE_SRC = _dragSrc;
            _this.targetJson = $(this).find("img").attr("data-json");
        }
    });
    $("#canvas").on("contextmenu",".insert",function(e){
        e.preventDefault();
        $(".contextMenu").hide().css({top:mousePosition(e).y,left:mousePosition(e).x}).show("fast");
    });
    $("#canvas").on({
        mousemove:function(e){
            e.preventDefault();
            if(moving && _dragDom && $(e.target).closest(".textNode").attr("data-uid")==_dragDom.attr("data-uid")){
                var dom = $(e.target).closest(".textNode").find("img");
                var per_x = mousePosition(e).x-mouseX,
                    per_y = mousePosition(e).y-mouseY,
                    top = parseFloat(dom.css("top")),
                    left = parseFloat(dom.css("left"));
                dom.css({"top":top+per_y,"left":left+per_x});
                mouseX = mousePosition(e).x;
                mouseY = mousePosition(e).y;
            }
            if(!!_dragDom && ($(e.target).closest(".textNode").length<=0 || $(e.target).closest(".textNode").attr("data-uid")!=_dragDom.attr("data-uid")) && _dragSrc != "" && moving){
                _dragDom.find("img").remove();
                _dragDom.find(".text").show();
                _dragDom.removeClass("insert").removeClass("blur");
                _this.isAdd = true;
                $("#canvas .textNode").addClass("event");
                _this.hideToobar();
                $(".moveDiv").find("img").attr("src",_this.MOVE_SRC).end().css({"display":"block","left": mousePosition(e).x-10,"top":mousePosition(e).y-10});
            }
        },
        mouseup:function(e){
            e.preventDefault();
            if(moving){
                var curDom = $(e.target).closest(".textNode");
                if(curDom.length>0 && _dragDom && _this.isAdd){
                    _dragDom.removeClass("insert").removeClass("active");
                    _dragDom.find("img").remove();
                    _dragDom.find(".text").show();
                    curDom.find("img").remove();
                    curDom.find(".text").hide();
                    curDom.append("<img data-json='"+ _this.targetJson +"' src='"+ _this.MOVE_SRC +"' />").addClass("insert").addClass("active");
                    _this.initToobar(_this.targetJson);
                    _this.targetJson = "";
                    fixImage(curDom);
                }
                mouseX = 0;
                mouseY = 0;
                moving = false;
                _dragSrc = "";
                _this.MOVE_SRC = "";
                _this.isAdd = false;
                _this.resizeCanvas();
            }
            $("#canvas .textNode").removeClass("event");
        },
        click:function(e){
            if($(e.target).closest(".insert").length<=0){
                $("#canvas .insert").addClass("blur").removeClass("active");
                _this.hideToobar();
            }
        },
        contextmenu:function(e){
            e.preventDefault();
        }
    });
    $(document).on({
        mouseup:function(e){
            e.preventDefault();
            $("#canvas .textNode").removeClass("event");
            mouseX = 0;
            mouseY = 0;
            moving = false;
            _dragSrc = "";
            _this.MOVE_SRC = "";
            if($(e.target).closest(".textNode").length<=0 && $(e.target).closest(".toolbar").length<=0 && $(e.target).closest(".contextMenu").length<=0){
                _this.isAdd = false;
                $("#canvas .insert").addClass("blur");
                $("#canvas .textNode").removeClass("active");
            }
            if($(e.target).closest(".textNode").length>=1 && _this.isAdd){
                $("#canvas .insert").addClass("blur").removeClass("active");
                var item = $(e.target).closest(".textNode");
                _this.getSrc(_this.targetJson,function(src){
                    item.find("img").remove();
                    item.find(".text").hide();
                    var img = new Image();
                    img.src = src;
                    img.onload = function(){
                        if(!_this.isAdd){return}
                        item.append($(img)).addClass("insert").addClass("active");
                        $(img).attr("data-json",_this.targetJson);
                        fixImage(item);
                        _this.initToobar(_this.targetJson);
                        _this.resizeCanvas();
                        _this.targetJson = "";
                        _this.isAdd=false;
                    };
                });
            }
            if($(e.target).closest(".toolbar").length>0){
                return;
            }
            $(".moveDiv").css({"left":-100,"top":-100,"display":"none"})
        },
        mousemove:function(e){
            e.preventDefault();
            if(_this.isAdd){
                $(".moveDiv").css({"left":mousePosition(e).x-10,"top":mousePosition(e).y-10});
            }
        },
        click:function(e){
            e.stopPropagation();
            if($(e.target).closest(".contextMenu").length<=0){
                $(".contextMenu").css({top:0,left:0}).hide();
            }
        }
    })
};
Canvas.prototype.resizeCanvas = function(){
    var _h = $(window).height();
    $("#aside .thumbs").height(_h-115);
    $("#controller").height(_h-34);
    var _this = this;
    var _height = $("#controller").height();
    if(_height != _this.CUR_HEIGHT){
        var per = _height/_this.CUR_HEIGHT;
        $("#canvas .item, #canvas .item img").each(function(){
            var new_w = $(this).width()*per,
                new_h = $(this).height()*per,
                new_t = parseFloat($(this).css("top"))*per,
                new_l = parseFloat($(this).css("left"))*per;
            $(this).css({"width":new_w,"height":new_h,"top":new_t,"left":new_l});
        });
        _this.CUR_HEIGHT = _height;
    }
};
Canvas.prototype.initToobar = function(uid){
    var _this = this;
    if(!$(".toolbar").attr("data-target") || $(".toolbar").attr("data-target") != uid){
        var arr=_this.BASE_JSON[uid];
        $(".toolbar .image-select").html("");
        $.each(arr,function(index,val){
            var str = '';
            if(val[0]=="png"){
                str = '<li class="png-select"><div data-src="'+ val[1] +'" style="background-image: url('+ val[1] +')"></div></li>';
            }else{
                str = '<li class="jpg-select"><div data-src="'+ val[1] +'" style="background-image: url('+ val[1] +')"></div></li>';
                $(".min-size img, .max-size img").attr("src",val[1]);
            }
            $(".toolbar .image-select").append(str);
        });
        if($("#canvas .active img").attr("src")){
            $(".image-select li div[data-src='"+ $("#canvas .active img").attr("src") +"']").parent().addClass("active");
        }else{
            $(".toolbar .image-select li:first").addClass("active");
        }
        if($("#canvas .active img").attr("data-slice")){
            var num = Number($("#canvas .active img").attr("data-slice"))*120>120?120:Number($("#canvas .active img").attr("data-slice"))*120;
            $(".line-inner").css("width",num);
        }
        $(".toolbar").attr("data-target",uid);
    }
    $(".toolbar").show();
};
Canvas.prototype.hideToobar = function(){
    $('.toolbar').hide();
};
Canvas.prototype.getSrc = function(uid,callback){
    var _this = this;
    $.ajax({
        url:"js/"+uid+".json",
        dataType:"json"
    }).done(function(minjson){
        _this.BASE_JSON[uid] = minjson;
        callback(minjson[0][1]);
    })
};
function buildImgNode(item,per){
    var str = '<div data-uid="uid_'+ item.uid +'" class="item selectNode" style="left: '+ Number(item.left)*per +'px; top: '+ Number(item.top)*per +'px; z-index: '+ item.zIndex +'; '+ $browser.getBrowserStyle("transform") +': matrix('+ item.transform[0] +', '+ item.transform[1] +', '+ item.transform[2] +', '+ item.transform[3] +', 0, 0);">'
        +'<img src="'+ item.image.src +'" style="width: '+ Number(item.image.width)*per +'px; height: '+ Number(item.image.height)*per +'px;"/>'
        +'</div>';
    return str;
}
function buildTxtNode(item,per){
    var str = '<div data-uid="uid_'+ item.uid +'" class="item selectNode textNode" style="left: '+ Number(item.left)*per +'px; top: '+ Number(item.top)*per +'px; z-index: '+ item.zIndex +'; '+ $browser.getBrowserStyle("transform") +': matrix('+ item.transform[0] +', '+ item.transform[1] +', '+ item.transform[2] +', '+ item.transform[3] +', 0, 0); width: '+ Number(item.width)*per +'px; height: '+ Number(item.height)*per +'px;">'
        +'<div class="bg"></div>'
        +'<div class="text" style="font-size:'+ per.toFixed(1) +'em">'+ item.text +'</div>'
    +'</div>';
    return str;
}
function fixImage(item){
    var img = item.find("img"),
        bw = item.width(),
        bh = item.height(),
        iw = img.width(),
        ih = img.height(),
        last_w = 0,last_h = 0;

    // 计算并设置拽入容器时 img 的宽高
    if(iw*bh/ih<=bw){ // 高相等
        last_w = iw*bh/ih;
        last_h = bh;
        var left = (bw-last_w)/2;
        img.css({"width":last_w,"height":last_h,"left":left,"top":0});
    }else{ // 宽相等
        last_h = bw*ih/iw;
        last_w = bw;
        var top = (bh-last_h)/2;
        img.css({"width":last_w,"height":last_h,"top":top,"left":0});
    }

    // 计算放入容器后图片与原图的百分比，原图设定宽、高较长的一个为 400px；
    var per = iw>ih?(last_w/400):(last_h/400);
    img.attr("data-slice",per.toFixed(2));
    $(".line-inner").css("width",per*120>120?120:per*120);
}
function mousePosition(ev){
    if(ev.pageX || ev.pageY){
        return {x:ev.pageX, y:ev.pageY};
    }
    return {
        x:ev.clientX + document.body.scrollLeft - document.body.clientLeft,
        y:ev.clientY + document.body.scrollTop - document.body.clientTop
    };
}
function setMatrix(item,style,type){
    var cur_css = item.css(style),
        matrix = cur_css && analysisMatrix(cur_css);

    // 各种点击情况 =_=#
    var case1 = (cur_css=="none" || cur_css==null || cur_css==undefined || cur_css=="") && type=="horizontal",
        case2 = (cur_css=="none" || cur_css==null || cur_css==undefined || cur_css=="") && type=="vertical",
        case3 = type=="horizontal" && Number(matrix[0])==-1,
        case4 = type=="horizontal" && Number(matrix[0])==1,
        case5 = type=="vertical" && Number(matrix[3])==-1,
        case6 = type=="vertical" && Number(matrix[3])==1;
    switch (true) {
        case case1 :
            item.css(style,"matrix(-1, 0, 0, 1, 0, 0)");
            break;
        case case2 :
            item.css(style,"matrix(1, 0, 0, -1, 0, 0)");
            break;
        case case3 :
            item.css(style,"matrix(1, 0, 0, "+ matrix[3] +", 0, 0)");
            break;
        case case4 :
            item.css(style,"matrix(-1, 0, 0, "+ matrix[3] +", 0, 0)");
            break;
        case case5 :
            item.css(style,"matrix("+ matrix[0] +", 0, 0, 1, 0, 0)");
            break;
        case case6 :
            item.css(style,"matrix("+ matrix[0] +", 0, 0, -1, 0, 0)");
            break;
    }
}
/**
 * 解析 matrix 值，返回由值转换出来的数组
 * @param str
 * @returns {Array}
 */
function analysisMatrix(str){
    var arr = str.substring(str.indexOf("(")+1,str.indexOf(")"));
    return arr.replace(/\s/g,"").split(",");
}

/**
 * 旧版 jQuery 中判断浏览器工具
 * @type {string}
 */
var userAgent = navigator.userAgent.toLowerCase();
var $browser = {
    safari:/webkit/.test(userAgent) && !/chrome/.test(userAgent),
    opera:/opr/.test(userAgent),
    msie:!!window.ActiveXObject || "ActiveXObject" in window,
    mozilla:/mozilla/.test(userAgent) && !/(compatible|webkit)/.test(userAgent),
    chrome:/chrome/.test(userAgent),
    getBrowserStyle:function(style){
        var _this = this;
        switch (true){
            case _this.safari || _this.chrome :
                return "-webkit-"+style;
                break;
            case _this.msie :
                return "-ms-"+style;
                break;
            case _this.mozilla :
                return "-moz-"+style;
                break;
            case _this.opera :
                return "-o-"+style;
                break;
            default :
                return style;
        }
    }
};

function ProgressBar(){}
ProgressBar.prototype.bind_fn = function(){
    var _this = this,
        _mouseX = 0, mouseClick = false;
    $(document).on({
        "mousedown":function(e){
            if($(e.target).attr("id")=="progressPoint"){
                e.stopPropagation(); // 避免因拖拽而选择到其他容器
                e.preventDefault();
                _mouseX = mousePosition(e).x;
                mouseClick = true;
            }
        },
        "mousemove":function(e){
            if(mouseClick){
                var parent = $("#progressPoint").parent(),
                    cur_w = parseFloat(parent.css("width")),
                    per = mousePosition(e).x-_mouseX;
                if(cur_w+per>120){
                    parent.css("width",120);
                }else if(cur_w+per<15){
                    parent.css("width",15);
                }else{
                    parent.css("width",cur_w+per);
                    var new_w = parseFloat(parent.css("width"));
                    progressSizeImg((new_w-cur_w)/cur_w);
                }
                _mouseX = mousePosition(e).x;
            }
        },
        "mouseup":function(e){
            mouseClick = false;
        }
    });
};
function progressSizeImg(per){
    var dom = $("#canvas .active img"),
        iw = parseFloat(dom.css("width")),// 不能用 dom.width()
        ih = parseFloat(dom.css("height")),
        il = parseFloat(dom.css("left")),
        it = parseFloat(dom.css("top"));
    dom.css({"width":iw+per*iw,"height":ih+per*ih,"top":it-per*ih/2,"left":il-per*iw/2});
}