from rodar import main
import datetime
def passos(p, abrir):
    p.add_init_script("window.__DB__.perfis[0].plus_teste_ate='2027-02-16T03:00:00Z';")
    # 1) durante o teste (03/02/2027 → faltam vários dias) e perto do fim (14/02)
    p.clock.install(time=datetime.datetime(2027,2,14,12,0,tzinfo=datetime.timezone.utc))
    abrir(p, '/'); p.wait_for_timeout(500)
    p.screenshot(path='/tmp/pl1.png')
    print('teste:', p.locator('text=Seu Plus grátis acaba').count())
main(passos)
