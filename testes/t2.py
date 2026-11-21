from rodar import main
def passos(p, abrir):
    abrir(p, '/k/00000000-0000-4000-8000-000000000001')
    p.screenshot(path='/tmp/k1.png')
    p.check('#cofre-nomes-k'); p.click('text=Criar link do cofrinho'); p.wait_for_timeout(500)
    p.screenshot(path='/tmp/k2.png')
    p.click('text=Só os totais'); p.wait_for_timeout(500)
    print('nomes depois do clique:', p.evaluate("window.__DB__.combinados[0].cofre_nomes"))
    p.screenshot(path='/tmp/k3.png')
    print([w for w in p.evaluate('window.__WRITES__') if 'tabela' in w])
main(passos)
