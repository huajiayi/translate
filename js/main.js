const from = "zh";
const to = "en";
const appid = "20180124000118252";
const key = "Yz1KlYPWReNbAjuJ4a1W";
const salt = 1435660288;
const url = "http://api.fanyi.baidu.com/api/trans/vip/translate";

//请求翻译API
function requestApi(query, callback){
    var sign = md5(appid + query + salt + key);

    $.ajax({
        url: url,
        type: 'get',
        dataType: 'jsonp',
        data: {
            q: query,
            appid: appid,
            salt: salt,
            from: from,
            to: to,
            sign: sign
        },
        success: function (data) {
            callback(data.trans_result[0].dst);
        } ,
        error: function(xhr){
            callback(null);
            console.log("错误提示： " + xhr.status + " " + xhr.statusText);
        }
    });
}

//遍历Json对象，找到一个属性就callback
function traverse(obj, callback){
    for (const p in obj) {
        if(obj.hasOwnProperty(p) && typeof obj[p] == "object"){
            traverse(obj[p], callback);
        }else{
            callback();
        }
    }
}

//递归翻译Json中的文本，成功回调true，失败回调false
function translateObj(obj, callback){
    for (const p in obj) {
        if(obj.hasOwnProperty(p) && typeof obj[p] == "object"){
            translateObj(obj[p], callback);
        }else{
            requestApi(obj[p], function(result){
                if(result != null){
                    obj[p] = result;
                    callback(true);
                }else{
                    obj[p] = "";
                    callback(false);
                }
            });
        }
    }
}

//获取Json属性总数（待翻译的文本数量）
function getCount(obj, callback){
    var count = 0;
    traverse(obj, function(){
        count++;
    })
    return count;
}

//翻译Json，回调翻译成功和失败的数量
function translate(obj, callback){
    var count = 0;
    var successCount = 0;
    var errorCount = 0;

    count = getCount(obj);

    translateObj(obj, function(isSuccess){
        if(isSuccess){
            successCount++;
        }else{
            errorCount++;
        }
        $("#progress").attr("class", "progress-radial progress-" + ((successCount + errorCount)/count*100));

        if(successCount + errorCount == count) callback(successCount, errorCount);
    });
}

$(function(){
    $("#translate").click(function(){
        $("#progress").attr("class", "progress-radial progress-0");

        var query = $("#query").val();
        if(query == null || query == "") return;
        
        var objStr;
        try {
            objStr = JSON.parse(query);
        } catch (error) {
            objStr = null;
        }
        
        $("#progress").show();
        $("#progressInfo").show();

        //如果是数字，则直接显示，不进行翻译
        if(Number(query).toString() != "NaN"){
            $("#result").val(query);
            $("#progress").attr("class", "progress-radial progress-100");
            $("#progressInfo").text("翻译成功！");
            return;
        };

        //如果是普通文本，则直接翻译
        if(objStr == null){
            requestApi(query, function(result){
                $("#progress").attr("class", "progress-radial progress-100");
                if(result == null){
                    $("#progressInfo").text("翻译失败！");
                    return;
                }

                $("#result").val(result);
                $("#progressInfo").text("翻译成功！");
            });
            return;
        }
    
        //翻译Json文本
        translate(objStr, function(successCount, errorCount){
            $("#progressInfo").text("共" + (successCount + errorCount) + "个     成功" + successCount + "个     失败" + errorCount + "个");
            $("#result").val(JSON.stringify(objStr, null, "\t"));
    
            console.log("总共翻译 " + (successCount + errorCount) + " 个");
            console.log("翻译成功 " + (successCount) + " 个");
            console.log("翻译失败 " + (errorCount) + " 个");
            console.log(JSON.stringify(objStr));
        });
    });
});