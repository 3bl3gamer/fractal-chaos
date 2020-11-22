# Генератор фракталов методом Хаоса

<img src="https://user-images.githubusercontent.com/1857617/99902222-3db32300-2ccd-11eb-8c0e-651a7759ac28.png" width="33.33%"/><img src="https://user-images.githubusercontent.com/1857617/99902219-3ab83280-2ccd-11eb-899e-bdf5bc4fcee3.png" width="33.33%"/><img src="https://user-images.githubusercontent.com/1857617/99902225-40157d00-2ccd-11eb-87cf-9876728a80e7.png" width="33.33%"/>

https://3bl3gamer.github.io/fractal-chaos/

Вдохновлено [одним видео с ютюба](https://youtu.be/o8TZMtoJPVs?t=623).


## Редактирование опорных точек

Через интерфейс нельзя (пока), можно добавить через отладчик:

```javascript
generator.getPoints().push({x:0.5, y:0.5}, {x:0.5, y:0.5})
clear()
runGenerator()
```

Или полностью заменить:

```javascript
generator.getPoints().length = 0
generator.getPoints().push(
    {x:0.1, y:0.1},
    {x:0.1, y:0.9},
    {x:0.9, y:0.1}
)
clear()
runGenerator()
```


## Демо-видео

### Через браузер

Медленно, однопоточно.

```javascript
renderDemo({
    size: 512,
    startFrame: 400,
    endFrame: null,
    frameStep: 0.25,
    maxPixValue: 0x20000,
    doRecord: true, //включает запись
    recorderOptions: {
        videoBitsPerSecond: 100 * 1000 * 1000,
        mimeType: 'video/webm;codecs=vp9'
    }
})
```

`doRecord` использует `requestFrame()`, а потому не работает (пока) в Фаерфоксе.

Видео пишется в реальном времени, так что кадры будут длиться на нескольку секунд (как и в браузерном превью). Исправить это можно с помощью
```
ffmpeg -i video.webm -r 60 -filter:v "setpts=N/(60*TB)" video_fixed.mp4
```

### Через Ноду

Запускает несколько процессов, обогревает комнату.

```bash
node demo.js 512 | ffmpeg -vcodec rawvideo -f rawvideo -pix_fmt rgba -s 512x512 -r 60 -i - -y t.mp4
```
