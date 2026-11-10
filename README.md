# Calculadora DP

Calculadora do Departamento Pessoal: saldo de horas, hora extra, adicional noturno e faltas.

## Como abrir no VS Code

1. Extraia o zip numa pasta do computador.
2. No VS Code: **Arquivo › Abrir Pasta…** e escolha a pasta `calculadora-dp`.
3. Para ver funcionando, abra o `index.html` no navegador (dois cliques no arquivo).
   Recomendado: instale a extensão **Live Server**, clique com o botão direito no `index.html`
   e escolha **Open with Live Server**. A página recarrega sozinha a cada vez que você salva.

## Estrutura

```
calculadora-dp/
├── index.html      estrutura da página (campos, abas, resumo)
├── css/style.css   visual (cores, tamanhos, layout)
├── js/app.js       toda a lógica e os cálculos
└── fonts/          fontes Lilita One e Open Sans
```

## Onde ficam os cálculos (js/app.js)

- `compute()` – hora extra, adicional noturno, faltas, DSR e totais
- `monthInfo()` – domingos, feriados nacionais e dias úteis do mês
- `nationalHolidays()` e `easter()` – feriados nacionais (Sexta-feira Santa é calculada pela Páscoa)
- `saldoMin()` / `renderSaldo()` – aba Saldo de horas
- `update()` – redesenha a memória de cálculo e o resumo
- `drawPNG()` – gera a imagem do resumo
- `makePDF()` – coloca essa imagem numa página A4 para o download em PDF

As horas são guardadas em **minutos** (ex.: 08:18 = 498) e convertidas para horas decimais
(498 ÷ 60 = 8,30) só na hora de multiplicar.

## Observação

Os dados digitados ficam salvos no navegador de quem usa (localStorage). Nada é enviado para a internet.
