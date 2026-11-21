from rodar import main
import datetime
def passos(p, abrir):
    p.add_init_script("window.__DB__.perfis[0].plus_teste_ate='2027-02-16T03:00:00Z';")
    p.clock.install(time=datetime.datetime(2027,3,1,12,0,tzinfo=datetime.timezone.utc))
    abrir(p, '/cartela/nova'); p.wait_for_timeout(500)
    p.fill('#titulo','Formatura'); p.fill('#qtd','300')
    v = p.locator('#valor')
    if v.count(): v.fill('10')
    p.click('#f button[type=submit]'); p.wait_for_timeout(500)
    p.screenshot(path='/tmp/pl2.png')
    p.click('.op-plano >> nth=0'); p.wait_for_timeout(300)
    print([w for w in p.evaluate('window.__WRITES__') if w.get('tabela')=='eventos'][-1:])
main(passos)
