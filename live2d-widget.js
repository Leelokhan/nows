var live2dModels = [
    'https://unpkg.com/live2d-widget-model-shizuku@1.0.5/assets/shizuku.model.json',
    'https://unpkg.com/live2d-widget-model-hijiki@1.0.5/assets/hijiki.model.json',
    'https://unpkg.com/live2d-widget-model-wanko@1.0.5/assets/wanko.model.json',
    'https://unpkg.com/live2d-widget-model-tororo@1.0.5/assets/tororo.model.json',
    'https://unpkg.com/live2d-widget-model-z16@1.0.5/assets/z16.model.json'
];
var currentModelIndex = 0;
function loadLive2DModel(index) {
    if(window.L2Dwidget){
        // 移除旧的canvas
        var oldCanvas = document.getElementById('live2dcanvas');
        if(oldCanvas) oldCanvas.remove();
    }
    L2Dwidget.init({
        model: {
            jsonPath: live2dModels[index],
        },
        display: {
            position: 'right',
            width: 320,
            height: 480,
            hOffset: 0,
            vOffset: -20
        },
        mobile: {
            show: true,
            scale: 0.5
        },
        react: {
            opacityDefault: 0.8,
            opacityOnHover: 0.2
        }
    });
}
// Live2D Widget Loader
(function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/live2d-widget@3.1.4/lib/L2Dwidget.min.js';
    script.onload = function() {
        loadLive2DModel(currentModelIndex);
        var btn = document.getElementById('switch-model-btn');
        if(btn){
            btn.onclick = function(){
                currentModelIndex = (currentModelIndex + 1) % live2dModels.length;
                loadLive2DModel(currentModelIndex);
            };
        }
    };
    document.body.appendChild(script);
})();