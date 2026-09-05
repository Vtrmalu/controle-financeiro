Especificação Técnica e Funcional: App Finanças Preditivo

Este documento serve como Prompt de Contexto da Aplicação (System Document) para evolução, refatoração e novas implementações via Antigravity / assistentes de código de IA.

1. Visão Geral do Projeto

Nome do Projeto: App Finanças Preditivo — Dashboard & Modals

Tipo: Single-Page Web Application (SPA) / PWA / Mobile Shell Simulation

Objetivo: Gestão financeira pessoal inteligente e preditiva. O aplicativo calcula em tempo real o Saldo Livre Real do usuário, abatendo receitas ativas de despesas já realizadas e de boletos agendados/futuros. Além disso, monitora dívidas negativadas no Serasa, gera acordos parcelados automaticamente e exibe métricas comparativas em gráficos dinâmicos.

2. Stack Tecnológica & Arquitetura

Framework UI: React (Hooks: useState, useRef, useEffect)

Estilização: Tailwind CSS (com classes utilitárias e CSS customizado via <style>)

Biblioteca de Ícones: lucide-react com wrapper ModernIcon (efeitos duo-tone, glassmorphism e sombras dinâmicas)

Visualização de Dados (Gráficos): SVG Nativo dinâmico (sem bibliotecas externas como Chart.js ou Recharts, garantindo renderização ultra-rápida e controle total de animações)

Detecção de Viewport: IntersectionObserver nativo para gatilho de animações ao rolar a tela (scroll-triggered animation)

3. Módulos Funcionais e Regras de Negócio

3.1. Motor Preditivo de Saldo & Visão Geral

Cálculo de Saldo Livre:


$$\text{Saldo Livre} = \text{Receitas do Período} - (\text{Despesas Pagas} + \text{Boletos Pendentes})$$

Barra de Comprometimento:
Calcula a porcentagem da renda já comprometida com despesas e boletos.

< 65%: Azul (Saudável)

65% - 85%: Âmbar (Atenção)

> 85%: Vermelho/Rose (Alerta Crítico)

Insights Preditivos IA: Banner descritivo atualizado dinamicamente informando o valor reservado para compromissos e o saldo disponível para uso diário.

3.2. Filtro Temporal e Calendário Interativo

Modo Mês/Ano: Grade de seleção rápida de meses e controle de ano.

Modo Intervalo (Calendário):

Seletor de data inicial e final diretamente em uma grade de calendário mensal.

Atritos rápidos: Hoje, Mês Atual, Próximo Mês.

Efeito Global: Alterar o período filtra instantaneamente:

Transações e despesas exibidas.

Boletos pendentes no período.

Distribuição por categoria no Donut Chart.

Balanço preditivo total.

3.3. Gráfico Donut de Despesas por Categoria

Construção: Renderização trigonométrica SVG baseada no acumulado de transações e boletos de cada categoria.

Linhas de Chamada (Tech Circuit Lines):

Linhas SVG ortogonais apontando do centro de cada arco do gráfico até as tags laterais.

Indicadores de porcentagem destacados para cada categoria.

Animação em Estágios (Multi-stage Transition):

Estágio 1 (Recoil/Fade Out): As linhas se recolhem para a borda do gráfico e as tags desaparecem (350ms).

Estágio 2 (Shift Left): O gráfico donut desliza suavemente para o canto esquerdo do card (1200ms).

Estágio 3 (Reveal Card): Um card detalhado da categoria selecionada surge do lado direito.

Retorno: Ao clicar em "Ver Todas", a sequência ocorre de forma inversa.

Gestão de Categorias (CRUD):

Criar: Define nome, cor (paleta predefinida) e meta/alocação base.

Editar: Altera propriedades e atualiza dinamicamente histórico de gastos/boletos associados.

Excluir: Confirmação com reatribuição automática de segurança dos lançamentos para uma categoria remanescente.

3.4. Gráfico Comparativo: Faturamento vs. Gastos (Linhas)

Visual: Estilo poligonal em linha contínua com gradientes translúcidos sob as curvas (Area Charts sobrepostos).

Filtros do Gráfico: Alternância independente entre 3M, 6M e 12M.

Animação por Scroll: Revelação progressiva da esquerda para a direita ativada via clipPath SVG e IntersectionObserver.

Tooltips Interativos: Exibe valores exatos de Faturamento, Gastos e Margem Líquida do mês ao passar o mouse ou tocar em um vértice.

3.5. Agenda de Boletos e Central de Compromissos

Ações Rápidas em Card (Swipe/Clique):

Marcar como Pago (paid).

Editar Boleto (Abre modal de edição).

Excluir Boleto.

Central de Boletos ("Ver Todos"):

Modal expansível sem limite de linhas.

Busca por texto em tempo real (nome ou categoria).

Filtros por status: Todos, Pendentes, Pagos, Acordos Serasa.

Alternância de escopo: Período Atual vs Todo o Histórico.

3.6. Monitoramento Serasa & Planejamento de Quitação

Visualização da Dívida:

Exibe Dívida Original vs. Proposta de Quitação.

Cálculo dinâmico da economia total acumulada ($) e projeção de ganho de Serasa Score (+pts).

Fluxo do Acordo e Geração Automática de Boletos:

Status: Negativado $\rightarrow$ Em Acordo $\rightarrow$ Quitado.

Regra Chave: Ao clicar em "Iniciar Acordo", o app calcula automaticamente as parcelas mensais (com base na opção escolhida: À vista, 3x, 6x, 12x) e gera boletos agendados marcados com [Boleto] ou [Cartão] na agenda principal de compromissos.

Filtros Internos: Busca por credor e filtro por status (negativado, em_acordo, quitado).

4. Estrutura de Estado (React State Reference)

Estado

Tipo

Descrição

dateFilterMode

'month' | 'range'

Define o modo de filtragem global de datas.

selectedMonthIndex / selectedYear

number

Mês e Ano selecionados no filtro.

rangeStartDate / rangeEndDate

string (YYYY-MM-DD)

Intervalo de datas para filtro personalizado.

transactions

Array<Transaction>

Lista de transações (entradas e saídas diárias).

bills

Array<Bill>

Lista de boletos e compromissos futuros.

categories

Array<Category>

Categorias ativas com ícones, cores e orçamentos.

serasaDebts

Array<SerasaDebt>

Dívidas negativadas, ofertas e planos de quitação.

activeSheet

string | null

Controla qual modal/bottom-sheet está visível.

activeCategory

Category | null

Categoria selecionada para zoom no Donut Chart.

animStage

'idle' | 'recoiling' | 'active' | 'returning'

Controla o ciclo de animação do gráfico Donut.

5. Próximos Passos & Prompt de Instrução para o Antigravity

Abaixo estão ideias de melhorias técnicas e funcionais estruturadas para solicitar ao Antigravity nas próximas iterações:

💡 Ideias de Recursos para Solicitar ao Antigravity:

Persistência de Dados (Local Base/PWA):

"Antigravity, adicione suporte a localStorage ou IndexedDB para que as categorias, transações, boletos e dívidas Serasa criados pelo usuário permaneçam salvos entre recarregamentos de página."

Exportação de Relatórios (PDF / CSV):

"Implemente uma função de exportação de dados na Central de Boletos e nos Lançamentos para gerar um relatório em formato CSV ou PDF formatado."

Simulador de Metas e Reserva de Emergência:

"Crie um novo módulo abaixo do gráfico de linhas para simulação de reserva de emergência, calculando em quantos meses o usuário atinge a meta com base na margem livre média."

Integração com Leitor de Código de Barras / OCR:

"Adicione um botão na modal 'Agendar Boleto' que simule a leitura de código de barras ou PIX Copia e Cola para preenchimento automático do valor e nome da conta."

Documento gerado para servir de base e memória de contexto para desenvolvimento contínuo via Antigravity.