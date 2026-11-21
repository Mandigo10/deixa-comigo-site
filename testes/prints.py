import sys, subprocess, time, os
from playwright.sync_api import sync_playwright
AQUI=os.path.dirname(os.path.abspath(__file__)); RAIZ=os.path.join(AQUI,'..','public')
srv = subprocess.Popen([sys.executable,'-m','http.server','8124','--directory',RAIZ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
mock=open(os.path.join(AQUI,'mock-supabase.js')).read(); dados=open(os.path.join(AQUI,'dados_prints.js')).read()
fontes = '/tmp/fontes'
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width':360,'height':640}, device_scale_factor=3)
    ctx.route('https://esm.sh/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=mock))
    ctx.route('https://fonts.googleapis.com/**', lambda r: r.abort())
    ctx.route('https://*.supabase.co/**', lambda r: r.abort())
    p = ctx.new_page(); p.add_init_script(dados)
    for nome, rota in [('inicio','/'),('alunos','/alunos'),('cofrinho','/cofre/'+'c'*32)]:
        p.goto('http://localhost:8124/app/#'+rota); p.wait_for_timeout(1500)
        p.evaluate("document.querySelectorAll('.inst-fundo').forEach(e=>e.remove())")
        p.screenshot(path=os.path.join(RAIZ,'app','tela-'+nome+'.png'))
    b.close()
srv.terminate()
