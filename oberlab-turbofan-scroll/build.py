import io
src = io.open('turbofan.html', encoding='utf-8').read()
i = src.index('<div class="stage"')
doc = (u'<!doctype html>\n<html lang="en">\n<head>\n'
       u'<meta charset="utf-8">\n'
       u'<meta name="viewport" content="width=device-width, initial-scale=1">\n'
       u'<meta name="description" content="Oberlab - a turbofan that assembles itself and spools to full thrust as you scroll. Procedural WebGL, no video.">\n'
       + src[:i].rstrip() + u'\n</head>\n<body>\n' + src[i:].rstrip() + u'\n</body>\n</html>\n')
io.open('index.html', 'w', encoding='utf-8').write(doc)
print('index.html rebuilt:', len(doc), 'bytes')
