# Especificação de Requisitos

**Plataforma de Apoio à Equipa de Serviços Integrados de Cuidados Paliativos da ULSBA**

| | |
|---|---|
| Unidade curricular | Projecto Integrado 2026-2027, Licenciatura em Engenharia Informática (IPBeja, ESTG) |
| Tutora | Elsa Rodrigues |
| Versão | 0.2, para validação pela tutora |
| Data | 11 de outubro de 2026 |

---

## Alterações face à versão 0.1

Esta versão mantém a organização temática da versão 0.1, mas reorganiza a numeração dos requisitos funcionais para que apareçam por ordem crescente (RF01 a RF42). Os requisitos não funcionais mantêm a numeração da versão 0.1 e os novos (RNF22 a RNF28) continuam a sequência. Os requisitos alterados trazem "(alt.)" no identificador e os novos trazem "(novo)".

- **Hipóteses sobre a ULSBA.** Ainda não foi recebida informação da ULSBA. As hipóteses de trabalho sobre a sua operação constam do Anexo A e servem de base aos requisitos com origem U, que têm de ser validados com a ULSBA.
- **Requisitos funcionais novos (11):** RF06 a RF09, RF14, RF23, RF24, RF28, RF35, RF41 e RF42. Correspondem à gestão de locais, aos estados e à lista de utentes, à geocodificação, à classificação IPCPAL, às visitas pendentes, aos profissionais, à sugestão de ordem das paragens, à exportação em PDF, à importação de dados e ao aviso de ambiente de teste.
- **Requisitos funcionais alterados:** RF02, RF03, RF04, RF05, RF10, RF11, RF12, RF13, RF15, RF16, RF17, RF19, RF20, RF21, RF22, RF25, RF26, RF29, RF30, RF32, RF33, RF34, RF37, RF38, RF39 e RF40.
- **Prioridades alteradas:** RF05 de Should para Must; RF38 de Must para Should; RF04 passa a cobrir só a marcação manual do ponto (a geocodificação automática é o novo RF09, Should).
- **Requisitos não funcionais.** Passam a ter prioridade e método de verificação. Há sete novos (RNF22 a RNF28). O RNF13 e o RNF14 foram reformulados, porque falam de produção e a produção está fora do âmbito. O RNF01 e o RNF04 foram precisados. O RNF16 passou para a secção 7.
- **Novas secções:** 5.10 (critérios de aceitação dos requisitos Must), pontos em aberto 9 a 15 e Anexo A (hipóteses de trabalho sobre a operação da ULSBA).
- **Totais:** 42 requisitos funcionais (20 Must, 16 Should, 6 Could) e 27 requisitos não funcionais em vigor.

---

## 1. Enquadramento

A Equipa de Cuidados Paliativos da ULSBA presta cuidados ao domicílio num território extenso e com população dispersa, com poucos meios. Para decidir quem visitar, quando e em que viatura, os profissionais recorrem hoje a vários sistemas que não comunicam entre si. A proposta pede uma plataforma web que junte essa informação num único sítio e apoie o planeamento e o registo das visitas.

Este documento fixa o que a plataforma deve fazer (requisitos funcionais) e com que qualidade o deve fazer (requisitos não funcionais). A proposta pede que a escolha de tecnologias seja fundamentada nos requisitos funcionais e não funcionais, e este documento serve de base a essa fundamentação.

Nem todos os requisitos têm o mesmo grau de certeza. A proposta e o mockup dão uma base firme, mas a própria proposta diz que os critérios de prioridade e as regras de planeamento têm de ser definidos e validados com a equipa da ULSBA. O que ainda depende dessa validação está assinalado e reunido na secção 8.

Ainda não foi recebida informação da ULSBA. As hipóteses de trabalho sobre a sua operação estão reunidas no Anexo A e têm de ser validadas com a equipa da ULSBA, sem utilização de dados pessoais ou clínicos reais nesta fase.

## 2. Âmbito

**Dentro do âmbito desta fase**

- Consulta e gestão da informação dos utentes (todos fictícios).
- Gestão dos locais onde os utentes estão e de onde as equipas partem (domicílios, lares, unidades e a base de Beja).
- Georreferenciação e visualização da distribuição dos utentes.
- Definição e atualização das prioridades de atendimento.
- Planeamento e gestão da agenda de visitas e da utilização das viaturas.
- Registo das visitas domiciliárias.
- Informação agregada para acompanhamento da atividade.
- Extração dos dados necessários ao algoritmo de otimização de rotas.

**Fora do âmbito**

- Integração com os sistemas de informação existentes na ULSBA. A proposta afasta-a desta fase e admite-a mais tarde, se existirem condições técnicas e institucionais.
- Utilização de dados reais. O desenvolvimento e os testes decorrem em ambiente *sandbox*, só com dados fictícios.
- A conceção do algoritmo matemático de otimização, que cabe à docente de Matemática. À equipa cabe a integração.
- Funcionamento sem ligação à internet e aplicação nativa para telemóvel.
- Operação em produção: cópias de segurança, disponibilidade e avaliação formal de conformidade com o RGPD ficam como recomendações para uma eventual passagem a produção.

## 3. Utilizadores

A proposta não define perfis de utilizador, mas o mockup mostra uma sessão da enfermeira coordenadora. Partimos de três perfis, a confirmar com a ULSBA.

| Perfil | O que faz na plataforma |
|---|---|
| Coordenador | Gere prioridades, monta a agenda, atribui viaturas, consulta relatórios. |
| Profissional de saúde | Consulta fichas, vê o plano do dia, regista visitas. |
| Administrador | Gere utilizadores, parâmetros e dados de referência. Não precisa de ver dados clínicos (RNF22). |

O perfil de acesso (o que se pode fazer na plataforma) é diferente da função clínica da pessoa (médico, enfermeiro). A mesma enfermeira pode ter o perfil de coordenador. Os dois conceitos devem ficar separados.

## 4. Convenções

**Prioridade (MoSCoW).** *Must* é indispensável para a entrega de fevereiro. *Should* entra se o prazo o permitir. *Could* é desejável, mas dispensável. Nada foi classificado como *Won't*; o que fica de fora está na secção 2. A prioridade aplica-se a requisitos funcionais e não funcionais.

**Origem.** Indica de onde vem o requisito, para ser possível defendê-lo.

| Código | Significado |
|---|---|
| P | Proposta de Projeto |
| M | Mockup |
| U | Hipótese de trabalho sobre a operação da ULSBA (Anexo A), ainda por validar com a ULSBA |
| E | Decisão da equipa, deduzida do contexto, a validar |

**Objetivos da proposta.** A proposta não os numera. Neste documento seguem a ordem em que aparecem e usam-se os códigos O1 a O6.

| Código | Objetivo |
|---|---|
| O1 | Aceder à informação relevante relativa aos utentes |
| O2 | Georreferenciar os utentes e visualizar a sua distribuição geográfica |
| O3 | Definir e atualizar prioridades de atendimento |
| O4 | Apoiar o planeamento e a gestão da agenda de visitas e viaturas |
| O5 | Registar as visitas domiciliárias |
| O6 | Sistematizar e disponibilizar informação de apoio ao acompanhamento da atividade |

**Verificação.** Cada requisito não funcional indica como se verifica (teste, medição ou inspeção). Os critérios de aceitação dos requisitos funcionais *Must* estão na secção 5.10.

---

## 5. Requisitos funcionais

### 5.1 Gestão de utentes

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF01 | Pesquisar um utente por número ou por nome, com sugestões à medida que se escreve. | O mockup tem os dois campos de pesquisa. Os nomes repetem-se muito (a lista de exemplo tem quatro "Maria Teresa"), por isso o número serve para desambiguar. | M | Must |
| RF02 (alt.) | Consultar a ficha do utente: identificação (número, nome, género, data de nascimento e idade), contacto, cuidador principal, local (tipo, morada, código postal, localidade e concelho) e coordenadas, médico assistente, situação clínica, datas de referenciação, de triagem e de admissão, data da última visita, notas e estado. | É o primeiro objetivo da proposta (O1) e o painel central do mockup. Os campos de datas, género e concelho são uma hipótese de trabalho (Anexo A, nota 4), a validar com a ULSBA. | P, M, U | Must |
| RF03 (alt.) | Criar, editar e inativar utentes, sem apagamento físico durante a atividade. Os prazos de conservação e eliminação ficam por definir (RNF23). | A ficha tem um estado ("Ativo"). Um utente que sai do acompanhamento deixa de entrar no planeamento, mas o histórico de visitas tem de se manter. | M, E | Must |
| RF04 (alt.) | Definir ou corrigir as coordenadas de um utente ou de um local marcando o ponto no mapa, com validação de que o ponto está no território. | A população é dispersa e muitas moradas rurais não são resolvidas bem por geocodificação automática. Sem coordenadas certas, mapa e rotas não servem. | P | Must |
| RF05 (alt.) | Registar o local onde o utente se encontra (domicílio, lar, unidade de cuidados continuados ou unidade de cuidados paliativos), com nome da instituição, morada, localidade, contacto telefónico e concelho. | Admite-se que haja utentes em lares e unidades (Serpa e Montemor, por exemplo), com implicações no acesso, na duração da visita e nas rotas (Anexo A, nota 4). | U | Must |
| RF06 (novo) | Gerir os locais como entidades próprias (domicílios, lares, unidades e a base de partida em Beja), partilháveis por vários utentes. | Vários utentes no mesmo lar ou unidade são uma só paragem para a equipa. Sem o local como entidade, a morada e as coordenadas repetem-se e podem ficar diferentes. | U, E | Must |
| RF07 (novo) | Registar as datas de referenciação e de admissão e acompanhar o estado do utente (referenciado, ativo, inativo). | Admite-se que a ULSBA registe estas datas (Anexo A, nota 4). Os estados e as readmissões estão por confirmar (ponto 8.11). | U, E | Should |
| RF08 (novo) | Listar utentes com filtros (prioridade, concelho, tipo de local, estado, sem visita há mais de um número de dias) e ordenação, exportável em CSV. | O mockup tem a secção "Utentes" e o botão "Ver Lista de Utentes". O RF16 filtra só o mapa. | M, E | Should |
| RF09 (novo) | Sugerir coordenadas a partir da morada (geocodificação) e guardar o resultado, para o utilizador confirmar ou corrigir. | Poupa trabalho ao criar fichas. Depende de um serviço externo com política de utilização (secção 7), por isso não é indispensável. | E | Should |

### 5.2 Prioridades de atendimento

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF10 (alt.) | Atribuir e atualizar a triagem de cada utente através de avaliações, guardando data, autor e motivo de cada uma. A avaliação mais recente é a prioridade atual e as anteriores ficam como histórico. | Objetivo O3. O histórico permite perceber porque é que um utente passou a urgente e quando. O mockup prevê a atualização a partir do painel de prioridade, com reflexo imediato no mapa. A frequência das reavaliações está por confirmar (ponto 8.11). | P, M | Must |
| RF11 (alt.) | Manter os níveis de triagem numa tabela configurável (código, designação, cor e ordem), sem alterar código. Os níveis iniciais são A, B, C e Não urgente. | O mockup usa cinco níveis em dias (urgente 0, 1 e 2 dias; não urgente 1 e 2), mas a hipótese de trabalho é uma triagem A, B, C e não urgente (Anexo A, nota 2). A proposta diz que os critérios têm de ser validados com a equipa, por isso o modelo tem de aguentar mudanças. | P, M, U | Must |
| RF12 (alt.) | Registar, em cada avaliação, o PPS (percentagem) e a classificação IPCPAL (altamente complexo, complexo, não complexo). | Admite-se que a priorização assente no PPS e na classificação IPCPAL (Anexo A, nota 3). | U | Should |
| RF13 (alt.) | Assinalar os utentes sem visita há mais do que um limite de dias configurável, por nível de prioridade. | O mockup tem um sino de notificações e uma contagem de urgentes. Admite-se que não há dias definidos para as visitas (Anexo A, nota 1), por isso o alerta não assenta num prazo da prioridade mas num limite configurável de dias sem visita. | M, E | Should |
| RF14 (novo) | Derivar a classificação IPCPAL a partir do PPS, só depois de a regra ser confirmada pela equipa clínica. | Não se sabe se o IPCPAL resulta do PPS ou se são avaliações separadas (ponto 8.1). Até lá, registam-se os dois valores (RF12). | U, E | Could |

### 5.3 Mapa

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF15 (alt.) | Mostrar os utentes num mapa (Leaflet e OpenStreetMap), com marcadores coloridos pelo nível de triagem e legenda lida dos parâmetros do sistema. Cada nível tem também texto ou ícone (RNF08). | Objetivo O2, desenhado no mockup. A legenda não pode ficar escrita no código, porque os níveis podem mudar. | P, M | Must |
| RF16 (alt.) | Filtrar o mapa por prioridade, concelho, tipo de local e estado. | O mockup tem o botão "Filtrar Utentes". Num território com vários concelhos, ver todos os pontos de uma vez deixa de ser útil. Os filtros por concelho, tipo de local e estado são uma decisão da equipa. | M, E | Must |
| RF17 (alt.) | Mostrar indicadores do conjunto visível: utentes no mapa, urgentes, não urgentes e distância total aproximada da rota planeada selecionada (uma equipa num dia). | Barra inferior do mockup. Que níveis contam como "urgentes" fica por confirmar (ponto 8.1). | M | Should |
| RF18 | Abrir a ficha do utente ao selecioná-lo no mapa. | Evita repetir a pesquisa quando já se está a trabalhar sobre o mapa. | E | Should |

### 5.4 Agenda e viaturas

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF19 (alt.) | Criar, reagendar e cancelar visitas, com vista diária e semanal. | Objetivo O4 e secção "Agenda" do menu. Como não há dias fixos de visita, a agenda tem de aceitar alterações constantes. | P, M, U | Must |
| RF20 (alt.) | Gerir as viaturas e as equipas e associar cada equipa a uma viatura. A associação é fixa por omissão e pode ser alterada. | A proposta fala de "agenda de visitas e viaturas". Admite-se que a operação use duas viaturas, cada uma com a sua equipa (Anexo A, nota 6). Se a associação variar de dia para dia, o modelo muda (ponto 8.2). | P, U | Must |
| RF21 (alt.) | Atribuir visitas a uma equipa e viatura. Impedir o que é impossível: a mesma equipa em dois locais diferentes ao mesmo tempo, ou o mesmo utente em duas visitas simultâneas. Avisar quando o plano sai do habitual (horário das 9h30 às 16h, regresso a Beja às 16h), permitindo ao coordenador confirmar a exceção com um motivo. Várias visitas no mesmo local e à mesma hora (lar ou unidade) são permitidas e contam como uma só paragem. | São regras de planeamento admitidas como hipótese (Anexo A), a validar com a ULSBA. As 9h30 e as 16h são o horário "habitual" (Anexo A, nota 5), por isso são avisos e não bloqueios: uma urgência pode exigir uma exceção. | U, E | Must |
| RF22 (alt.) | Propor, para um dia, a lista de utentes a visitar ordenada por triagem, depois por dias desde a última visita e depois por proximidade, que o coordenador pode ajustar. | Corresponde ao botão "Ver Lista de Utentes". É uma ajuda de planeamento que não depende do algoritmo. O peso de cada critério fica por confirmar (ponto 8.1). | M, E | Should |
| RF23 (novo) | Registar a necessidade de uma visita (estado pendente), sem equipa nem hora, e atribuir a equipa e o horário mais tarde, quando a visita passa a planeada. Listar as visitas pendentes por prioridade. | Como se admite que não há dias fixos, o fluxo provável é primeiro surgir a necessidade e só depois haver planeamento. Sem este conceito, o alerta (RF13) e a lista sugerida (RF22) não têm base. | M, U, E | Must |
| RF24 (novo) | Gerir os profissionais (nome, função, contacto, ativo), a composição habitual de cada equipa e registar quem foi a cada visita. | A composição das equipas pode mudar de dia para dia (ponto 8.2). Sem isto, o registo da visita não diz quem a fez. | P, U, E | Should |

### 5.5 Rotas

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF25 (alt.) | Mostrar no mapa a rota planeada de cada viatura, com a ordem das paragens e a distância estimada em linha reta. | Permite ao coordenador ver o dia de cada equipa antes de o confirmar. A fonte das distâncias está por confirmar (ponto 8.5). | M, E | Should |
| RF26 (alt.) | Exportar, para um dia e em formato estruturado (JSON ou CSV, com versão do formato), os dados de que o algoritmo precisa: paragens com coordenadas e os utentes de cada uma, prioridades, duração prevista das visitas, equipas e viaturas, ponto de partida, janela horária e matriz de distâncias. A exportação não inclui dados identificativos: os utentes vão com identificadores pseudonimizados. | A proposta diz que, nesta fase, se contempla "apenas a possibilidade de extração dos dados" para o algoritmo. É o mínimo obrigatório da componente de rotas. O formato exato deve ser acordado com a docente de Matemática (ponto 8.4). | P, E | Must |
| RF27 | Integrar o algoritmo de otimização e importar o resultado como proposta de plano editável. | O botão "Gerar Rota Ótima" está no mockup, mas a proposta situa o algoritmo numa fase futura, ainda que mais adiante atribua à equipa a sua integração. Fica como *Could* até se esclarecer o ponto 8.4. Até lá, o botão fica visível mas inativo. | P, M | Could |
| RF28 (novo) | Sugerir uma ordem simples das paragens (vizinho mais próximo), como referência para comparar com o algoritmo. | O RF32 quer comparar planeamento manual e otimizado. Sem uma referência simples, não há com que comparar enquanto o algoritmo não existir. | E | Could |

### 5.6 Registo de visitas

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF29 (alt.) | Registar uma visita: data, hora de início e de fim reais, equipa, viatura, profissionais presentes, resultado (realizada ou cancelada, com motivo) e notas. | Objetivo O5. Uma visita realizada tem de ter início e fim reais. | P | Must |
| RF30 (alt.) | Mostrar a "última visita" na ficha do utente, calculada a partir do histórico, e indicar quando o utente ainda não tem visitas. | O campo existe na ficha do mockup e não deve depender de preenchimento duplicado. Um utente recém-admitido ainda não tem visitas e a interface não pode falhar por isso. | M | Must |
| RF31 | Consultar o histórico de visitas por utente, equipa e viatura. | Sem histórico não há acompanhamento da atividade (O6). | P | Must |
| RF32 (alt.) | Calcular os quilómetros estimados por equipa e por dia. Registar os quilómetros reais (odómetro ou GPS) só se existir fonte. | A proposta quer melhorar a eficiência de um serviço com poucos recursos. Os quilómetros são o indicador mais direto para comparar planeamento manual e otimizado. Hoje só há estimativa por cálculo (ponto 8.5). | E | Should |

### 5.7 Informação de acompanhamento

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF33 (alt.) | Painel inicial com indicadores: utentes ativos por prioridade, visitas planeadas, realizadas e pendentes, utentes sem visita há mais do que o limite (RF13) e quilómetros estimados. | Objetivo O6. O painel é a página de entrada do mockup. | P, M | Should |
| RF34 (alt.) | Relatórios filtráveis por período, equipa e concelho, exportáveis em CSV. | A secção "Relatórios" está no menu do mockup e a proposta pede informação "sistematizada e disponibilizada". | P, M | Should |
| RF35 (novo) | Exportar em PDF os relatórios e o plano do dia, para impressão. | Útil para quem trabalha em deslocação, mas dá mais trabalho do que o CSV. | E | Could |

### 5.8 Comunicação

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF36 | Enviar mensagens internas e notificações entre membros da equipa. | A introdução fala de necessidades de "comunicação da Unidade" e o mockup tem a secção "Mensagens". Não consta dos objetivos, por isso fica como *Could*. | M | Could |

### 5.9 Utilizadores e administração

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF37 (alt.) | Autenticação com perfis (coordenador, profissional de saúde, administrador) e sessão com expiração. | Mesmo em sandbox, o desenho deve refletir o uso real: nem todos podem alterar prioridades ou ver tudo. | M, E | Must |
| RF38 (alt.) | Interface para gerir utilizadores e as suas permissões. Entretanto, os utilizadores de teste poderão ser providenciados pelo sistema centralmente. | Consequência de RF37. Numa equipa de quatro pessoas e quatro meses, a interface de gestão pode ficar para depois da autenticação base. | E | Should |
| RF39 (alt.) | Parametrizar horário de visitas, ponto de partida, duração média por tipo de visita, limite de dias sem visita. Os níveis de triagem são geridos no RF11. | Menu "Configurações". Evita escrever regras da ULSBA no código, que ainda podem mudar. | M, E | Should |
| RF40 (alt.) | Carregar um conjunto de dados fictícios, com distribuição geográfica realista no Baixo Alentejo, de forma reproduzível: a mesma execução dá sempre os mesmos dados. | A proposta exige sandbox com dados fictícios. Sem dados verosímeis, não se testam o mapa, as distâncias nem a priorização. O mockup usa uma zona da área de Lisboa (Oeiras, Carnaxide), pelo que o conjunto de dados tem de ser construído de raiz para o Baixo Alentejo. | P | Must |
| RF41 (novo) | Importar utentes e visitas a partir de um ficheiro CSV com estrutura previamente definida e validada, apresentando um relatório das linhas rejeitadas. | A importação poderá facilitar o carregamento inicial ou a atualização dos dados. A estrutura e as regras de validação do CSV terão de ser definidas e confirmadas com a equipa da ULSBA (ponto 8.9). | U, E | Could |
| RF42 (novo) | Indicar de forma visível, em todas as páginas, que o ambiente é de teste com dados fictícios. | Evita confundir a sandbox com dados reais, sobretudo em demonstrações. | E | Should |

### 5.10 Critérios de aceitação dos requisitos Must

Os valores numéricos são metas de trabalho. Servem para as fases de teste (fase 3) dizerem se um requisito passou ou não.

| ID | Critério de aceitação |
|---|---|
| RF01 | Ao escrever 3 ou mais caracteres do nome ou do número, aparecem até 5 sugestões em menos de 1 segundo. Selecionar uma sugestão abre a ficha. |
| RF02 | A ficha mostra todos os campos listados. Um campo sem valor aparece como "sem informação" e nunca provoca erro. |
| RF03 | Inativar um utente retira-o do planeamento e do mapa por omissão, e o histórico de visitas continua consultável. A interface não tem operação de apagamento físico. |
| RF04 | Marcar um ponto no mapa grava as coordenadas. Um ponto fora de Portugal continental, ou com latitude e longitude trocadas, é recusado com uma mensagem. |
| RF05 | Cada utente tem exatamente um local associado. Os locais do tipo lar ou unidade exigem nome. |
| RF06 | Um local pode ser partilhado por vários utentes. Alterar a morada ou as coordenadas do local reflete-se em todos os utentes desse local. |
| RF10 | Cada avaliação de triagem guarda data, autor e motivo. A ficha mostra a mais recente como atual e permite consultar as anteriores. |
| RF11 | Acrescentar ou alterar um nível de triagem não exige alterar código. O mapa e a legenda refletem os parâmetros. |
| RF15 | Cada marcador tem a cor do nível e a legenda tem texto. Com 500 utentes, o mapa carrega em menos de 3 segundos (RNF09). |
| RF16 | Cada filtro reduz em conjunto os marcadores e os contadores. Combinar filtros dá a interseção. |
| RF19 | Reagendar e cancelar mantêm o registo da visita (estado cancelada). A vista diária e a semanal mostram o mesmo conjunto de visitas. |
| RF20 | O sistema permite gerir frota e equipas. Não é possível associar a mesma viatura a duas equipas simultaneamente. |
| RF21 | Planear a mesma equipa em dois locais diferentes à mesma hora, ou o mesmo utente em duas visitas simultâneas, é recusado. Planear fora das 9h30 às 16h, ou com regresso depois das 16h, mostra um aviso e só grava depois de confirmado com motivo. Três utentes no mesmo lar à mesma hora são aceites. |
| RF23 | É possível criar uma visita sem equipa nem hora. Aparece na lista de pendentes, ordenada por prioridade, e passa a planeada quando recebe equipa e hora. |
| RF26 | A exportação de um dia gera um ficheiro válido segundo o formato acordado, sem nome, morada nem número de utente, e inclui as distâncias entre as paragens. |
| RF29 | Uma visita realizada só grava com início e fim reais e com equipa. Uma visita cancelada exige motivo de cancelamento suportado pelo modelo. |
| RF30 | Um utente sem visitas realizadas mostra "sem visitas" e não provoca erro. Depois de registar uma visita, a última visita atualiza-se sem ser preciso preencher o campo à mão. |
| RF31 | O histórico filtra por utente, equipa e viatura e está ordenado da visita mais recente para a mais antiga. |
| RF37 | Sem sessão iniciada, não se acede a nenhuma página com dados. A sessão expira. As palavras-passe só podem existir na forma encriptada. |
| RF40 | Executar o carregamento de dados de demonstração recria sempre o mesmo conjunto base realista, com utentes distribuídos pelos concelhos do Baixo Alentejo. |

---

## 6. Requisitos não funcionais

Os valores numéricos são metas de trabalho, não compromissos contratuais. Não há na proposta números de utentes ou de utilizadores; partimos de uma ordem de grandeza (centenas de utentes, poucos utilizadores em simultâneo) que deve ser confirmada.

### 6.1 Segurança e proteção de dados

| ID | Requisito | Justificação | Origem | Prior. | Verificação |
|---|---|---|---|---|---|
| RNF01 (alt.) | Só dados fictícios no desenvolvimento e nos testes. A estrutura de dados deverá guardar apenas o necessário para o planeamento e o acompanhamento. | Os dados de saúde são categoria especial no RGPD (art. 9.º). A proposta usa a sandbox precisamente para proteger dados pessoais e clínicos. Limitar os campos já agora evita problemas se o sistema vier a passar a produção. | P | Must | Inspeção do modelo de dados e do script de dados de demonstração. |
| RNF02 | Autenticação obrigatória, palavras-passe tratadas com mecanismos criptográficos (Argon2 ou bcrypt), sessões ou tokens com expiração e acesso limitado por perfil. | A sandbox deve comportar-se como o sistema real, para que a passagem a produção não obrigue a refazer o controlo de acessos. | E | Must | Teste de acesso por perfil e inspeção da gestão de sessões e do armazenamento das palavras-passe. |
| RNF03 | Comunicação cifrada (HTTPS) sempre que a plataforma seja acedida fora da máquina de desenvolvimento. Segredos e credenciais fora do repositório Git. | O repositório é partilhado no GitHub. Uma credencial enviada por engano para o repositório fica no histórico mesmo depois de apagada. | E | Must | Inspeção do `.gitignore` e do histórico do repositório. |
| RNF04 (alt.) | Registo de auditoria das alterações a fichas, avaliações e visitas (quem, quando, o quê). O registo das consultas é desejável, mas dispensável. | Em dados clínicos é preciso poder saber quem alterou um registo. Registar também todas as consultas dá muito trabalho e muito volume. | E | Should | Inspeção das tabelas de auditoria (ou triggers) e teste de alteração de uma ficha. |
| RNF22 (novo) | Cada perfil vê só o que precisa. O administrador não acede a dados clínicos. | Princípio do menor privilégio. Depende da definição dos perfis (ponto 8.14). | E | Should | Teste de acesso com cada perfil. |
| RNF23 (novo) | Definir prazos de conservação e um mecanismo de eliminação ou anonimização dos dados dos utentes inativos. | O RF03 diz "sem apagamento físico", mas o RGPD prevê limites de conservação e o direito ao apagamento. Em produção, os dois têm de ser conciliados. | E | Should | Inspeção do procedimento documentado. |
| RNF24 (novo) | As exportações para o algoritmo de rotas não devem conter dados identificativos diretos. | Protege os dados fora do sistema. Liga-se ao RF26. | E | Must | Inspeção do ficheiro exportado. |
| RNF25 (novo) | Proteção contra os riscos mais comuns de aplicações web: consultas parametrizadas (sem montar SQL a partir de texto do utilizador), validação das entradas e limite de tentativas de início de sessão. | O RNF02 trata das palavras-passe e da sessão, mas não destes riscos. | E | Should | Revisão do código contra a lista OWASP Top 10, com consultas parametrizadas ou ORM. |

### 6.2 Usabilidade e acessibilidade

| ID | Requisito | Justificação | Origem | Prior. | Verificação |
|---|---|---|---|---|---|
| RNF05 | As tarefas frequentes (encontrar um utente, ver a ficha, registar uma visita) devem ser feitas em poucos passos. Meta de trabalho: registar uma visita em menos de dois minutos. | Os utilizadores são profissionais de saúde com pouco tempo. A fase 3 inclui testes de usabilidade, que precisam de um critério para dizer se passaram ou não. | P, E | Should | Teste de usabilidade com cronómetro. |
| RNF06 | Interface utilizável em computador, tablet e telemóvel. | As equipas trabalham em deslocação. Basta uma aplicação web responsiva; uma aplicação nativa fica fora do âmbito. | E | Should | Teste em três larguras de ecrã (computador, tablet e telemóvel) sem perda de funções. |
| RNF07 | Interface em português europeu, datas no formato dd/mm/aaaa e fuso horário de Lisboa. | Utilizadores e contexto institucional portugueses. | E | Must | Inspeção da interface e tratamento regionalizado. |
| RNF08 | A prioridade nunca depende só da cor: cada nível tem também ícone ou texto, e os contrastes cumprem WCAG 2.1 AA. | No mockup, os marcadores do mapa distinguem os cinco níveis apenas pela cor. Uma pessoa com daltonismo não distinguiria, por exemplo, laranja de vermelho no mapa. | E | Should | Verificação de contraste e de visualização sem cor. |

### 6.3 Desempenho e escala

| ID | Requisito | Justificação | Origem | Prior. | Verificação |
|---|---|---|---|---|---|
| RNF09 | Pesquisa de utente e abertura da ficha em até 1 segundo; mapa com 500 utentes carregado em até 3 segundos, usando agrupamento de marcadores se necessário. | O mockup tem 24 utentes, mas o dimensionamento não deve ficar apertado ao exemplo. | E | Should | Medição de performance sobre o conjunto de testes planeado. |
| RNF10 | A arquitetura deverá permitir acrescentar viaturas, equipas e concelhos estruturalmente sem exigir reescrita do sistema. | Hoje são duas viaturas; é razoável que a unidade cresça. | E | Should | Inspeção do modelo de dados: viaturas, equipas e concelhos em tabelas próprias. |
| RNF11 | Interrogações geográficas (utentes por zona, distâncias) apoiadas num motor espacial dedicado e índices adequados. | Evita que o mapa e os filtros degradem à medida que os dados crescem. | E | Should | Medição de tempos de consulta com PostgreSQL/PostGIS e índices espaciais (GiST). |

### 6.4 Fiabilidade e disponibilidade

| ID | Requisito | Justificação | Origem | Prior. | Verificação |
|---|---|---|---|---|---|
| RNF12 | Validação dos dados no cliente e no servidor, com restrições de integridade na base de dados (chaves estrangeiras, unicidade e verificações) e operações compostas feitas em transação. | Uma visita registada pela metade (sem atualizar a última visita, por exemplo) deixa o planeamento errado sem ninguém dar por isso. | E | Must | Inspeção das chaves estrangeiras e restrições, e teste de falha a meio de uma operação composta. |
| RNF13 (alt.) | A base de dados deverá ser recriável de forma limpa a partir de *scripts* automáticos (ex: ferramentas de migração) e dados genéricos de ensaio. Cópias de segurança regulares são apenas recomendação para produção. | Em sandbox, o que importa é a fiabilidade da infraestrutura partilhada de desenvolvimento. | E | Should | Recriar a base de dados do zero em menos de 10 minutos. |
| RNF14 (alt.) | Disponibilidade durante o horário de atividade da equipa (aproximadamente 8h–18h em dias úteis) como recomendação para produção. Em sandbox não há requisito de disponibilidade. | Não há requisito formal na proposta, e um nível de serviço de 24 horas seria desproporcionado para este contexto. | E | Could | Não aplicável em sandbox. |
| RNF26 (novo) | Os instantes (datas e horas) devem ser guardados com fuso horário. | O RNF07 só trata da apresentação. Uma visita planeada à volta da mudança de hora de outubro pode ficar uma hora errada. | E | Must | Inspeção do modelo de dados (por exemplo, o tipo `timestamptz`). |
| RNF27 (novo) | Usar um único sistema de coordenadas (WGS84, SRID 4326) e validar que os pontos estão dentro do território. | Trocar latitude e longitude é um erro comum, porque o Leaflet e o PostGIS usam ordens diferentes. | E | Must | Teste com pontos inválidos, que a base de dados deve recusar. |

### 6.5 Manutenibilidade, testes e documentação

| ID | Requisito | Justificação | Origem | Prior. | Verificação |
|---|---|---|---|---|---|
| RNF15 | Código separado em camadas (interface, lógica de negócio, acesso a dados), em TypeScript no *frontend* e com tipagem no *backend*. | Equipa a trabalhar em paralelo exige fronteiras claras e modulares. | P, E | Should | Revisão estrutural do repositório. |
| RNF17 | API testada com ferramentas de validação de endpoints (ex: Postman). Regras de prioridade e de planeamento cobertas com testes. | A proposta nomeia ferramentas de endpoint validation. As regras de negócio são o ponto crítico do sistema. | P, E | Must | Evidência de coleções de testes ou execução CI. |
| RNF18 | API documentada (ex: OpenAPI), arquitetura geral e modelo de dados documentados. | A proposta inclui documentação técnica entre as competências a desenvolver. | P | Must | Inspeção da documentação da API e do diagrama entidade-relação. |
| RNF28 (novo) | O esquema da base de dados deve ser versionado com migrações. O modelo, o diagrama e o dicionário de dados devem ser atualizados em conjunto com cada alteração. | Sem versionamento, cada programador acaba com uma base de dados diferente. | E | Must | Inspeção das migrações e da documentação do modelo de dados. |

### 6.6 Portabilidade e interoperabilidade

| ID | Requisito | Justificação | Origem | Prior. | Verificação |
|---|---|---|---|---|---|
| RNF19 | Ambiente reproduzível com contentores (ex: Docker) e configuração por variáveis de ambiente. | Ambiente colaborativo heterogéneo exige base comum. | E | Must | Todos os membros conseguem arrancar o ambiente com um só comando. |
| RNF20 | API REST desacoplada da interface, suportando formatos estandardizados (JSON, CSV). | Facilita a ligação ao algoritmo de otimização de rotas, que pode estar noutra linguagem. | P | Must | Inspeção da especificação da API e teste das exportações. |
| RNF21 | Compatibilidade com as duas últimas versões dos navegadores atuais (Chrome, Edge, Firefox, Safari). | A ULSBA pode usar dispositivos e navegadores que a equipa não testa por omissão. | E | Should | Teste nos quatro navegadores. |

O RNF16 da versão 0.1 (Git, GitHub, Conventional Commits e *pull requests*) passou para a secção 7, porque é uma regra de trabalho da equipa e não uma qualidade do sistema.

---

## 7. Restrições

- **Prazo e equipa.** De outubro de 2026 ao início de fevereiro de 2027, com três ou quatro estudantes. Parte da equipa trabalha em simultâneo, o que reduz a capacidade real. Por isso se separou com cuidado o que é essencial (*Must*) do que pode ficar para o fim. Os requisitos mais pesados são o RF04, o RF21 e o RF37. Se as estimativas de esforço não couberem no prazo, são os primeiros candidatos a simplificação.
- **Dados.** Apenas dados fictícios, em ambiente sandbox. Não serão utilizados dados pessoais ou clínicos reais nesta fase.
- **Integração.** Sem ligação aos sistemas da ULSBA nesta fase.
- **Arquitetura.** Web, cliente-servidor, assente em tecnologias de persistência estruturada relacional.
- **Cartografia.** Integração orientada a Leaflet e OpenStreetMap (proposta). Os mapas base do OpenStreetMap têm limites de tráfego que, para a sandbox, servirão; a longo prazo sugerem fornecedor alternativo.
- **Geocodificação.** A conversão de moradas em coordenadas (RF09) usa um serviço externo, que também tem política de utilização e limite de pedidos. Os resultados devem ser guardados para não repetir pedidos.
- **Convenções de desenvolvimento.** Controlo de versões com Git e GitHub, *commits* segundo a convenção Conventional Commits e alterações integradas por *pull request* (antigo RNF16). A convenção torna o histórico legível para quem não escreveu o código.
- **Algoritmo.** Concebido pela docente de Matemática, fora do controlo da equipa informática.

## 8. Pontos em aberto

Questões que devem ser fechadas na próxima reunião de acompanhamento ou diretamente com a ULSBA e com a docente de Matemática. Cada uma altera requisitos concretos no desenho.

1. **Modelo final de prioridades.** Os níveis em dias do mockup, a triagem A/B/C da ULSBA e a classificação IPCPAL a partir do PPS são três modelos diferentes. Qual manda na cor do mapa e na ordem das visitas? O IPCPAL resulta do PPS ou são avaliações separadas? Existe um prazo de visita por nível? Afeta o planeamento (RF10 a RF13, RF17, RF22 e RF14).
2. **Regras de planeamento.** Confirmar horário (9h30 às 16h), regresso a Beja às 16h, número de viaturas e equipas, duração média por tipo de visita e eventuais pausas. As equipas têm profissionais e viatura fixos, ou variam de dia para dia? Afeta estrutura de agenda (RF20, RF21, RF39 e RF24).
3. **Dados mínimos na ficha.** O mockup mostra diagnósticos e notas clínicas. Que campos a equipa precisa mesmo de ver para planear? Afeta o detalhe da entidade base (RF02 e RNF01).
4. **Âmbito do algoritmo.** A proposta diz, numa passagem, que a integração é futura e, noutra, que compete à equipa integrá-lo. Se for nesta fase, RF27 sobe para *Should* e o calendário muda. Que formato de dados espera a docente de Matemática? Afeta modelo de extração (RF26 e RF27).
5. **Fonte das distâncias.** Linha reta, serviço de encaminhamento externo ou motor próprio? Condiciona lógicas de processamento do espaço (RF17, RF25 e RF32).
6. **Utilização no terreno.** As equipas vão consultar a plataforma no telemóvel durante as visitas? Se sim, poderá existir necessidade de suporte off-line (RNF06).
7. **Mensagens e notificações.** Existe necessidade real de comunicação dentro da plataforma? O que representa o número no sino do mockup? Afeta desenho do chat e interações (RF13 e RF36).
8. **Números de referência.** Quantos utentes ativos, quantos utilizadores simultâneos? Afeta dimensionamento e testes de carga (RNF09 e RNF10).
9. **Estrutura dos dados para importação.** Confirmar com a ULSBA, sem partilha de dados pessoais, os campos necessários, os tipos de dados, os valores permitidos e as regras de validação do CSV. Como devem ser representados o género e o local? Afeta a modelação dos dados e a importação (RF02, RF05 e RF41).
10. **Registo de visitas.** Quem regista as visitas e quando (no momento ou no fim do dia)? Há contactos não presenciais (telefone) a registar? Que campos são obrigatórios e que motivos de cancelamento existem? Afeta workflow de conclusão de visita (RF29).
11. **Estados do utente e reavaliações.** Que estados existem (referenciado, admitido, alta, óbito)? Um utente pode ser readmitido? Com que frequência se reavaliam a triagem, o PPS e o IPCPAL? Afeta histórico e campos de estado (RF10 e RF07).
12. **Lares e unidades.** Quantos utentes se visitam por cada ida a um lar ou unidade, e quanto dura uma visita coletiva? Qual é o concelho da unidade de Montemor admitida no Anexo A? Afeta estruturação da relação local-utente e planeamento (RF05, RF21 e RF06).
13. **Conservação dos dados.** Por quanto tempo se guardam os dados de utentes inativos e o que acontece depois? Afeta compliance de integridade referencial (RF03 e RNF23).
14. **Perfis e permissões.** Quem pode alterar prioridades? Quem vê as coordenadas exatas e os dados clínicos? Afeta tabelas de privilégios ou encriptação por roles (RF37, RNF02 e RNF22).
15. **Validação das hipóteses de trabalho.** Todas as hipóteses do Anexo A (triagem A/B/C, classificação IPCPAL, horário das visitas, viaturas e equipas, tipos de local e campos do utente) têm de ser confirmadas pela equipa da ULSBA. Afeta todos os requisitos com origem U.

## 9. Rastreabilidade

Cada objetivo da proposta tem de ter pelo menos um requisito que o realize.

| Objetivo | Requisitos funcionais |
|---|---|
| O1 Aceder à informação relevante dos utentes | RF01, RF02, RF03, RF05, RF31, RF06, RF07, RF08 |
| O2 Georreferenciar e visualizar a distribuição geográfica | RF04, RF15, RF16, RF17, RF18, RF09 |
| O3 Definir e atualizar prioridades de atendimento | RF10, RF11, RF12, RF13, RF14 |
| O4 Apoiar o planeamento da agenda de visitas e viaturas | RF19, RF20, RF21, RF22, RF25, RF26, RF27, RF23, RF24, RF28 |
| O5 Registar as visitas domiciliárias | RF29, RF30, RF31, RF32 |
| O6 Sistematizar e disponibilizar informação de acompanhamento | RF26, RF33, RF34, RF35 |
| Suporte transversal (acessos, dados de teste, comunicação, importação) | RF36, RF37, RF38, RF39, RF40, RF41, RF42 |

Os requisitos não funcionais não realizam um objetivo, protegem a forma como os objetivos são cumpridos. Ligam-se aos requisitos funcionais assim:

| Requisitos não funcionais | Protegem |
|---|---|
| RNF01, RNF22, RNF23, RNF24 (dados e privacidade) | RF02, RF03, RF26, RF40 |
| RNF02, RNF03, RNF25 (acesso e segurança) | RF37, RF38 |
| RNF04 (auditoria) | RF10, RF29 |
| RNF05, RNF06, RNF07, RNF08 (usabilidade) | RF01, RF15, RF19, RF29 |
| RNF09, RNF10, RNF11 (desempenho e escala) | RF15, RF16, RF20 |
| RNF12, RNF13, RNF26, RNF27 (integridade) | RF04, RF19, RF21, RF29 |
| RNF14 (disponibilidade, só como recomendação para produção) | Todos |
| RNF15, RNF17, RNF18, RNF19, RNF28 (qualidade da construção) | Todos |
| RNF20, RNF21 (interoperabilidade) | RF26, RF34 |

## 10. Referências

Documentos do projeto:

- Proposta de Projeto, *Uma Plataforma de Apoio à Equipa de Serviços Integrados de Cuidados Paliativos da ULSBA*, IPBeja, 22/09/2026.
- `mockup.png`, anexo à proposta.

Bibliografia indicada na proposta e relevante para este documento:

- Sommerville, I. (2024). *Engineering Software Products: An Introduction to Modern Software Engineering*. Pearson.
- Um-in, N., & Tharmmaphornphilas, W. (2025). A comprehensive review of home health care routing and scheduling optimization. *Engineering Journal*, 29(11), 39–64. https://doi.org/10.4186/ej.2025.29.11.39
- Ramires, P., Pardal, A. C., & Godinho, M. T. (2023). Towards an Integrated Information System for a Higher Education Institution Volunteering Group. *CAPSI 2023 Proceedings*, 1. https://aisel.aisnet.org/capsi2023/1
- Sar, K., & Ghadimi, P. (2024). A Web-Interface Based Decision Support System for Optimizing Home Healthcare Waste Collection Vehicle Routing. *Logistics*, 8(4). https://doi.org/10.3390/logistics8040119
- Emiliano, W. M., et al. (2025). Optimizing home health care: a decision support system for districting and fleet management in urban health services. *Environment, Development and Sustainability*. https://doi.org/10.1007/s10668-025-06736-w

---

## Anexo A. Hipóteses de trabalho sobre a operação da ULSBA

Ainda não foi recebida da ULSBA nenhuma informação além da proposta de projeto e do mockup. Para poder avançar, a equipa admitiu as hipóteses abaixo sobre a operação da Unidade. São a base dos requisitos com origem U. Foram registadas pela equipa no quadro de trabalho, sem fonte documental da ULSBA. Têm de ser confirmadas com a equipa da ULSBA (ponto 8.15) e não devem ser apresentadas como factos.

1. **Dias de visita.** Admite-se que não há dias fixos para as visitas e que dependem das situações de urgência.
2. **Triagem (urgência).** Admite-se uma triagem com quatro níveis: A (muito urgente), B (urgente), C (pouco urgente) e Não urgente.
3. **Priorização (complexidade), baseada no PPS.** Admite-se a classificação IPCPAL: altamente complexo, complexo e não complexo.
4. **Dados do utente.** Admite-se que a ficha tem nome, número de utente, datas de referenciação, de triagem e de admissão, idade, género, concelho, local, morada, localidade, contacto telefónico e coordenadas. Admite-se que o local é a casa do utente, um lar ou uma unidade (por exemplo, em Serpa ou em Montemor), com estado ativo ou inativo e histórico de visitas.
5. **Horário.** Admite-se que as visitas decorrem entre as 9h30 e as 16h e que às 16h as equipas estão de volta a Beja.
6. **Viaturas e equipas.** Admite-se que há duas viaturas, ou seja, duas equipas em simultâneo, e que o território é o Baixo Alentejo.