from rodar import main
def passos(p, abrir):
    abrir(p, '/combinar/vaquinha')
    nome = p.locator('[data-lista="pessoas"][data-k="nome"]').first
    nome.scroll_into_view_if_needed()
    p.locator('.bt-contatos').first.click(); p.wait_for_timeout(300)
    p.screenshot(path='/tmp/sel1.png')
    p.fill('.sel input[type=search]', 'car'); p.wait_for_timeout(200)
    p.click('.sel-lista button'); p.wait_for_timeout(300)
    print('linha 1:', nome.input_value(), '|', p.locator('[data-lista="pessoas"][data-k="telefone"]').first.input_value())
    p.click('text=Adicionar pessoa'); p.wait_for_timeout(300)
    n2 = p.locator('[data-lista="pessoas"][data-k="nome"]').nth(1)
    n2.click(); n2.type('an', delay=50); p.wait_for_timeout(300)
    p.screenshot(path='/tmp/sel2.png')
    p.locator('.sugestoes button').first.click(); p.wait_for_timeout(300)
    print('linha 2:', n2.input_value(), '|', p.locator('[data-lista="pessoas"][data-k="telefone"]').nth(1).input_value())
main(passos)
