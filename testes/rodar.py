import sys, subprocess, time, json
from playwright.sync_api import sync_playwright
RAIZ='/home/claude/deixa-comigo-site/public'
srv = subprocess.Popen([sys.executable,'-m','http.server','8123','--directory',RAIZ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
mock=open(__import__('os').path.join(__import__('os').path.dirname(__file__),'mock-supabase.js')).read()
dados=open(__import__('os').path.join(__import__('os').path.dirname(__file__),'dados.js')).read()
def abrir(p, rota, extra=''):
    p.goto('http://localhost:8123/app/#'+rota); p.wait_for_timeout(1200)
def main(passos):
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = b.new_context(viewport={'width':400,'height':900})
        ctx.route('https://esm.sh/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=mock))
        ctx.route('https://fonts.googleapis.com/**', lambda r: r.abort())
        ctx.route('**/config.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body="window.DXCMG_CONFIG={SUPABASE_URL:'https://x.supabase.co',SUPABASE_KEY:'k',GOOGLE_CLIENT_ID:'teste.apps.googleusercontent.com'};"))
        ctx.route('https://accounts.google.com/**', lambda r: r.abort())
        ctx.route('https://*.supabase.co/**', lambda r: r.abort())
        p = ctx.new_page()
        erros=[]
        p.on('pageerror', lambda e: erros.append(str(e)))
        p.on('console', lambda m: erros.append('console: '+m.text) if m.type=='error' else None)
        p.add_init_script(dados)
        passos(p, abrir)
        print('ERROS:', erros)
        b.close()
    srv.terminate()
