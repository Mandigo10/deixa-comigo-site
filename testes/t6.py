from rodar import main
def passos(p, abrir):
    # simula o pedido de instalação do Chrome (Android)
    p.add_init_script("""window.addEventListener('load',()=>{ setTimeout(()=>{ const e=new Event('beforeinstallprompt'); e.prompt=()=>{window.__PROMPT__=true}; e.userChoice=Promise.resolve({outcome:'accepted'}); window.dispatchEvent(e); }, 300); });""")
    abrir(p, '/'); p.wait_for_timeout(3500)
    p.screenshot(path='/tmp/inst.png')
    p.click('.inst .sim'); p.wait_for_timeout(300)
    print('prompt chamado:', p.evaluate('window.__PROMPT__===true'))
main(passos)
