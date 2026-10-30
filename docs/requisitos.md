# Especificação de Requisitos

**Plataforma de Apoio à Equipa de Serviços Integrados de Cuidados Paliativos da ULSBA**

| | |
|---|---|
| Unidade curricular | Projecto Integrado 2026-2027, Licenciatura em Engenharia Informática (UPBeja, ESTIG) |
| Tutora | Elsa Rodrigues |
| Versão | 0.3, proposta de atualização após a reunião de 28/10/2026 (pendente de validação) |
| Data | 30 de outubro de 2026 |

---

## Alterações face à versão 0.2

A **versão 0.3** é a primeira atualização proposta para partilha com a equipa após a **v0.2, de 11/10/2026**. Incorpora as observações registadas na reunião com a docente Maria Teresa de Abreu Luís Godinho, em **28/10/2026**, bem como os esclarecimentos resultantes da revisão técnica e da evolução do frontend. Não existiu uma versão 0.3 anterior aprovada ou partilhada com o grupo.

As alterações descrevem **requisitos propostos ou clarificados**, não regras clínicas ou operacionais confirmadas pela ULSBA. A existência de uma interface no protótipo não demonstra que a funcionalidade esteja implementada na API, na base de dados ou em termos de segurança.

- **Requisitos funcionais existentes revistos (26):** RF02, RF03, RF07, RF08, RF10, RF11, RF12, RF14, RF17, RF19, RF20, RF21, RF22, RF23, RF24, RF25, RF26, RF27, RF29, RF31, RF32, RF33, RF34, RF35, RF37 e RF39.
- **Requisitos funcionais acrescentados (7):** RF43 a RF49, relativos à gestão de voltas, detalhe do calendário, ocorrências, validação de horários, atrasos, gestão detalhada de viaturas e restrições de acesso por equipa.
- **Requisitos não funcionais revistos (9):** RNF02, RNF04, RNF05, RNF06, RNF12, RNF15, RNF22, RNF26 e RNF27. Não foram introduzidos novos RNF.
- **Prioridades propostas:** RF08, RF12 e RF24 passam de *Should* para *Must*; RNF04, RNF06 e RNF22 passam de *Should* para *Must*. Esta alteração depende da concordância da equipa e da tutora, tendo em conta o prazo disponível.
- **Totais da proposta v0.3:** **49 requisitos funcionais (28 Must, 15 Should, 6 Could)** e **27 requisitos não funcionais (16 Must, 10 Should, 1 Could)**. Na v0.2 existiam 42 RF (20 Must, 16 Should, 6 Could) e 27 RNF (13 Must, 13 Should, 1 Could).

### Consolidação técnica e decisões propostas para a versão 0.3

Esta revisão mantém a numeração **RF01–RF42** da versão partilhada e acrescenta **RF43–RF49**, sem reutilizar identificadores. Mantém igualmente os 27 RNF em vigor. Os critérios de aceitação foram aprofundados para possibilitar testes objetivos. **O documento não constitui validação clínica ou operacional da ULSBA**; as decisões de âmbito e a priorização abaixo permanecem propostas.

- **Urgência, complexidade e PPS são conceitos distintos:** a urgência determina a prioridade clínica; a complexidade pode apoiar a estimativa de duração; o PPS não determina automaticamente a complexidade sem regra clínica validada (RF12 e RF14).
- **Planeamento:** uma volta confirmada pode ter uma ou mais visitas; uma volta em rascunho pode ainda não ter visitas. Uma paragem partilhada não implica que um profissional consiga executar atos clínicos simultâneos.
- **Viaturas:** a disponibilidade para um período deve considerar reservas e indisponibilidades, incluindo manutenção, e não apenas um estado estático.
- **Calendário:** nas vistas Unidade e Profissional são apresentados os horários da volta; na vista Utente aparecem as horas de início e fim da visita, sem o filtro de equipas. A atribuição habitual de uma equipa responsável não impede exceções futuras sem validação da ULSBA.
- **Segurança e rastreabilidade:** permissões de consulta/edição e identificação do autor devem ser verificadas e persistidas na API, não apenas simuladas ou apresentadas no React.
- **Algoritmo:** mantém-se obrigatório disponibilizar os dados necessários à otimização (RF26). A integração do algoritmo (RF27, *Could*) depende da decisão sobre o âmbito e da docente de Matemática; o planeamento manual tem de funcionar autonomamente.
- **Funcionalidades não bloqueantes:** RF09, RF14, RF28, RF35, RF36 e RF41 permanecem documentados como candidatos a desenvolvimento posterior. RF38 pode ser implementado após a autenticação base; RF34 pode começar por relatórios simples. A classificação *Should* ou *Could* de cada requisito permanece na respetiva tabela.

### Histórico anterior — passagem da v0.1 para a v0.2 (já partilhada)

Para contextualização, a versão 0.2 manteve a organização temática da versão 0.1 e reorganizou a numeração dos requisitos funcionais para que apareçam por ordem crescente (RF01 a RF42). Os requisitos não funcionais mantêm a numeração da versão 0.1 e os novos (RNF22 a RNF28) continuam a sequência. Os requisitos alterados trazem "(alt.)" no identificador e os novos trazem "(novo)".

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
- Planeamento manual de visitas e voltas, agenda (Unidade, Utente e Profissional), composição de equipas e disponibilidade temporal das viaturas.
- Registo das visitas domiciliárias, horários previstos e reais, ocorrências e respetiva autoria.
- Informação agregada para acompanhamento da atividade.
- Extração dos dados necessários ao algoritmo de otimização de rotas.

**Fora do âmbito**

- Integração com os sistemas de informação existentes na ULSBA. A proposta afasta-a desta fase e admite-a mais tarde, se existirem condições técnicas e institucionais.
- Utilização de dados reais. O desenvolvimento e os testes decorrem em ambiente *sandbox*, só com dados fictícios.
- A conceção do algoritmo matemático de otimização, que cabe à docente de Matemática. À equipa cabe a integração.
- Funcionamento sem ligação à internet e aplicação nativa para telemóvel.
- Operação em produção: cópias de segurança, disponibilidade e avaliação formal de conformidade com o RGPD ficam como recomendações para uma eventual passagem a produção.

## 3. Utilizadores

A proposta não define perfis de utilizador, mas o mockup mostra uma sessão da enfermeira coordenadora. Partimos de três perfis, a confirmar com a ULSBA. A operação com dados clínicos de utentes nesta entrega usa apenas **dados fictícios**.

| Perfil | O que faz na plataforma |
|---|---|
| Coordenador | Gere prioridades, utentes (nos limites da autorização), voltas, agenda, equipas e viaturas; consulta relatórios. |
| Profissional de saúde | Consulta os utentes e as voltas a que tem acesso, regista horários reais e ocorrências e edita os campos para os quais tem autorização. |
| Administrador | Gere utilizadores, parâmetros e dados de referência. Não precisa de ver dados clínicos (RNF22). |

O perfil de acesso (o que se pode fazer na plataforma) é diferente da função clínica da pessoa (médico, enfermeiro). A mesma enfermeira pode ter o perfil de coordenador. Os dois conceitos devem ficar separados. Uma **equipa responsável pelo utente** não deve ser confundida com a **equipa executante de uma visita**. A reunião sugeriu ausência de rotação habitual e a ocultação do filtro de equipas na vista Utente; isso não basta para proibir substituições excepcionais na base de dados sem validação com a ULSBA.

## 4. Convenções

**Prioridade (MoSCoW).** *Must* é indispensável para a entrega de fevereiro, condicionado a aprovação formal do âmbito e da capacidade da equipa. *Should* entra se o prazo o permitir. *Could* é desejável, mas dispensável. Nada foi classificado como *Won't*; o que fica de fora está na secção 2. A prioridade aplica-se a requisitos funcionais e não funcionais.

**Origem.** Indica de onde vem o requisito, para ser possível defendê-lo.

| Código | Significado |
|---|---|
| P | Proposta de Projeto |
| M | Mockup |
| U | Hipótese de trabalho sobre a operação da ULSBA (Anexo A), ainda por validar com a ULSBA |
| E | Decisão da equipa, deduzida do contexto, a validar |
| D | Observação/sugestão registada na reunião com a docente em 28/10/2026, pendente de validação operacional com a ULSBA |

**Objetivos da proposta.** A proposta não os numera. Neste documento seguem a ordem em que aparecem e usam-se os códigos O1 a O6.

| Código | Objetivo |
|---|---|
| O1 | Aceder à informação relevante relativa aos utentes |
| O2 | Georreferenciar os utentes e visualizar a sua distribuição geográfica |
| O3 | Definir e atualizar prioridades de atendimento |
| O4 | Apoiar o planeamento e a gestão da agenda de visitas e viaturas |
| O5 | Registar as visitas domiciliárias |
| O6 | Sistematizar e disponibilizar informação de apoio ao acompanhamento da atividade |

**Verificação.** Cada requisito não funcional indica como se verifica (teste, medição ou inspeção). Os critérios de aceitação dos requisitos funcionais *Must* estão na secção 5.11.

---

## 5. Requisitos funcionais

### 5.1 Gestão de utentes

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF01 | Pesquisar um utente por número ou por nome, com sugestões à medida que se escreve. | O mockup tem os dois campos de pesquisa. Os nomes repetem-se muito (a lista de exemplo tem quatro "Maria Teresa"), por isso o número serve para desambiguar. | M | Must |
| RF02 (alt.) | Consultar a ficha do utente: identificação (número, nome, género, data de nascimento e idade), contacto, local (tipo, morada, código postal, localidade, concelho e coordenadas), equipa responsável, médico assistente, situação clínica, datas de referenciação, triagem e admissão, última visita, notas, prioridade, complexidade e estado. No Dashboard, apresentar «Equipa Responsável» em vez de «Cuidador Principal»; eventual contacto de cuidador, se clinicamente necessário, é um campo distinto a validar. | O1 e painel do mockup; substituição da etiqueta e distinção prioridade/complexidade sugeridas na reunião. A existência e composição exatas dos dados clínicos continuam a requerer validação. | P, M, U, D | Must |
| RF03 (alt.) | Criar, editar e inativar utentes, sem apagamento físico durante a atividade; disponibilizar formulário de edição com campos editáveis apenas a profissionais autorizados. Manter histórico e respeitar as regras de conservação por definir (RNF23). | A docente salientou que o botão Editar deve funcionar e que não basta ocultar campos a utilizadores sem permissão: a API deve rejeitar alterações não autorizadas. | M, E, D | Must |
| RF04 (alt.) | Definir ou corrigir as coordenadas de um utente ou de um local marcando o ponto no mapa, com validação de que o ponto está no território. | A população é dispersa e muitas moradas rurais não são resolvidas bem por geocodificação automática. Sem coordenadas certas, mapa e rotas não servem. | P | Must |
| RF05 (alt.) | Registar o local onde o utente se encontra (domicílio, lar, unidade de cuidados continuados ou unidade de cuidados paliativos), com nome da instituição, morada, localidade, contacto telefónico e concelho. | Admite-se que haja utentes em lares e unidades (Serpa e Montemor, por exemplo), com implicações no acesso, na duração da visita e nas rotas (Anexo A, nota 4). | U | Must |
| RF06 (novo) | Gerir os locais como entidades próprias (domicílios, lares, unidades e a base de partida em Beja), partilháveis por vários utentes. | Vários utentes no mesmo lar ou unidade são uma só paragem para a equipa. Sem o local como entidade, a morada e as coordenadas repetem-se e podem ficar diferentes. | U, E | Must |
| RF07 (novo) | Acompanhar o ciclo de vida do utente (referenciado, ativo, inativo e eventuais readmissões), preservando datas de transição, motivo e histórico. As datas de referenciação/admissão são apresentadas na ficha (RF02), não introduzidas como campos redundantes. | Distingue dados que se consultam na ficha (RF02) de transições de estado verificáveis. Estados definitivos e readmissões carecem de validação. | U, E | Should |
| RF08 (alt.) | Listar utentes com coluna explícita de **complexidade**, ordenação e filtros combináveis por prioridade, estado, complexidade e data da última visita; concelho e tipo de local continuam suportados. A exportação CSV, se implementada, pertence ao RF34 (Should). | Filtros e coluna de complexidade foram solicitados pela docente e são necessários à utilização quotidiana da listagem. | M, E, D | Must |
| RF09 (novo) | Sugerir coordenadas a partir da morada (geocodificação) e guardar o resultado, para o utilizador confirmar ou corrigir. | Poupa trabalho ao criar fichas. Depende de um serviço externo com política de utilização (secção 7), por isso não é indispensável. | E | Should |

### 5.2 Prioridades de atendimento

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF10 (alt.) | Criar avaliações de triagem imutáveis (com retificação auditada), com instante, autor autenticado, motivo e nível de urgência; mostrar como atual a avaliação válida mais recente. Uma reavaliação pode aumentar ou reduzir a urgência. | Reavaliações são eventos históricos; uma alteração clínica não pode sobrescrever silenciosamente os dados anteriores. | P, M, D | Must |
| RF11 (alt.) | Gerir o catálogo configurável de níveis de **urgência** (código, designação, cor, ordem e eventuais prazos/limites) independentemente do catálogo IPCPAL/complexidade. A correspondência entre rótulos em dias do mockup e a hipótese A/B/C/Não urgente não é presumida. | Evita misturar duas escalas clínicas incompatíveis sem validação; o mapa e a ordenação usam o catálogo de urgência aprovado. | P, M, U, D | Must |
| RF12 (alt.) | Registar **complexidade/IPCPAL** (altamente complexo, complexo, não complexo), com data e autor, separada da triagem de urgência; apresentar na ficha e na lista e utilizá-la para estimar duração através de regra configurável (RF39). O **PPS**, quando clinicamente aplicável, é registado como valor independente e não obriga ao cálculo automático de IPCPAL. | A docente tornou a complexidade central no planeamento e na duração, embora a regra clínica continue por validar. | U, D | Must |
| RF13 (alt.) | Assinalar os utentes sem visita há mais do que um limite de dias configurável, por nível de prioridade. | O mockup tem um sino de notificações e uma contagem de urgentes. Admite-se que não há dias definidos para as visitas (Anexo A, nota 1), por isso o alerta não assenta num prazo da prioridade mas num limite configurável de dias sem visita. | M, E | Should |
| RF14 (novo) | [BACKLOG — sujeito a validação clínica] Permitir o cálculo automático da classificação de complexidade do utente (IPCPAL — Não complexo, Complexo ou Altamente complexo) com base no valor do PPS (Palliative Performance Scale), apenas se a ULSBA confirmar que existe uma regra clínica válida para estabelecer essa relação. Caso contrário, o PPS e a complexidade devem continuar a ser avaliados e registados separadamente pelos profissionais de saúde, conforme previsto no RF12. | O PPS avalia o estado funcional do utente, enquanto o IPCPAL avalia a complexidade das suas necessidades. Um determinado valor de PPS não implica necessariamente um nível específico de complexidade. Por isso, o cálculo automático só poderá ser implementado mediante validação clínica, evitando classificações incorretas. | U, E | Could |

### 5.3 Mapa

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF15 (alt.) | Mostrar os utentes num mapa (Leaflet e OpenStreetMap), com marcadores coloridos pelo nível de triagem e legenda lida dos parâmetros do sistema. Cada nível tem também texto ou ícone (RNF08). | Objetivo O2, desenhado no mockup. A legenda não pode ficar escrita no código, porque os níveis podem mudar. | P, M | Must |
| RF16 (alt.) | Filtrar o mapa por prioridade, concelho, tipo de local e estado. | O mockup tem o botão "Filtrar Utentes". Num território com vários concelhos, ver todos os pontos de uma vez deixa de ser útil. Os filtros por concelho, tipo de local e estado são uma decisão da equipa. | M, E | Must |
| RF17 (alt.) | Apresentar indicadores calculados a partir do conjunto efetivamente visível e da volta selecionada: utentes, urgentes/não urgentes e distância prevista **apenas quando calculada**; mostrar «por calcular» quando não existe estimativa e indicar a origem da distância. | Evita apresentar distâncias fictícias como se fossem dados operacionais e alinha contadores com filtros e mapa. | M, E | Should |
| RF18 | Abrir a ficha do utente ao selecioná-lo no mapa. | Evita repetir a pesquisa quando já se está a trabalhar sobre o mapa. | E | Should |

### 5.4 Agenda e viaturas

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF19 (alt.) | Criar, reagendar e cancelar visitas manualmente; apresentar calendários mensal, semanal e diário nas perspetivas Unidade, Utente e Profissional. Em Unidade/Profissional, identificar volta e horas previstas de partida/regresso; na vista Utente, mostrar início/fim da **visita**. Não apresentar filtro de equipas na vista Utente, mantendo autorização na API. | Corresponde às imagens da reunião e às correções posteriores de horário e filtro; a ausência do filtro não implica uma regra rígida de equipa imutável. | P, M, U, D | Must |
| RF20 (alt.) | Gerir equipas e viaturas como entidades próprias, com associação habitual opcional e atribuição temporal por volta, consultando reservas e indisponibilidades; rejeitar a utilização da mesma viatura em intervalos incompatíveis. | Uma viatura não pode ser considerada livre só porque o seu estado atual é «disponível»; manutenções e agenda interferem na disponibilidade. | P, U, D | Must |
| RF21 (alt.) | Planear visitas/voltas após verificar horário, equipa, **profissionais efetivamente escalados**, viatura e utente. Rejeitar incompatibilidades temporais; permitir agrupar visitas de vários utentes na mesma **paragem/local**, sem presumir que uma única pessoa consegue executar duas visitas clínicas simultâneas. Exceções ao horário habitual exigem motivo e confirmação autorizada. | Distingue partilha de local de simultaneidade de atos clínicos; limita os conflitos de recursos e mantém horários da ULSBA como hipótese. | U, E, D | Must |
| RF22 (alt.) | Produzir uma lista sugerida de necessidades de visita, ordenada primeiro pela prioridade/urgência clínica; desempates (dias sem visita, proximidade, etc.) configuráveis. Usar a **complexidade apenas na estimativa do esforço/duração**, sem a confundir com urgência, e permitir ajuste manual por coordenador. | A ordem clínica por urgência é distinta da duração estimada e da otimização de distâncias; pesos exigem validação. | M, E, D | Should |
| RF23 (novo) | Registar uma visita **pendente** sem equipa, viatura, hora e eventualmente sem data de execução; apenas quando agendada exigir os elementos temporais e recursos definidos no RF21. Listar pendentes por prioridade e permitir passagem para planeada com histórico. | Evita criar horários fictícios na origem de uma necessidade de visita; define a transição entre os estados. | M, U, E | Must |
| RF24 (alt.) | Gerir profissionais, função e estado, composição/escala das equipas ao longo do tempo, participantes efetivos nas visitas e designação legível das equipas (A, B, C, etc.). Manter distinção entre **equipa responsável pelo utente** e **equipa que executa a volta**, incluindo histórico de atribuições quando mudam. | Sem composição e participantes reais não existem calendário por profissional, controlo de conflitos e autoria confiável. | P, U, E, D | Must |

### 5.5 Rotas

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF25 (alt.) | Apresentar a sequência das paragens da volta num mapa, diferenciando os pontos reais de uma linha ilustrativa. Mostrar percurso viário/duração ou distâncias apenas se existirem dados de encaminhamento, com fonte e método identificados. | Não é correto apresentar linhas retas como percurso efetivo sem indicar que são apenas uma representação. | M, E, D | Should |
| RF26 (alt.) | Exportar dados estruturados e versionados para o algoritmo: identificadores técnicos, paragens geográficas com referência aos utentes associados, prioridades, estimativas de duração, recursos, janelas temporais, base e matriz de distâncias quando disponível. Minimizar os campos e evitar identificadores diretos; coordenadas continuam dados potencialmente reidentificáveis. | É o mínimo explícito da proposta. Pseudonimização não significa anonimização das localizações. O contrato será validado com a docente de Matemática. | P, E | Must |
| RF27 (alt.) | [DEPENDENTE DE DECISÃO DE ÂMBITO] Integrar o resultado do algoritmo de otimização **quando disponibilizado pela docente de Matemática** como proposta de volta/agenda, sem aplicação automática silenciosa; permitir ao coordenador aceitar, ajustar ou rejeitar. | A proposta coloca a extração de dados nesta fase e a integração do algoritmo numa fase futura, embora preveja a responsabilidade de integração pela equipa. | P, M, D | Could |
| RF28 (novo) | Sugerir uma ordem simples das paragens (vizinho mais próximo), como referência para comparar com o algoritmo. | O RF32 quer comparar planeamento manual e otimizado. Sem uma referência simples, não há com que comparar enquanto o algoritmo não existir. | E | Could |

### 5.6 Registo de visitas

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF29 (alt.) | Registar a execução da visita com estado, equipa, participantes efetivos, instantes reais de início/fim e notas/ocorrências com autor atribuído pelo servidor. Calcular duração pelos instantes; cancelamentos exigem motivo. Horários reais não são obrigatórios antes da conclusão. | Distingue visitas pendentes, planeadas, em curso, concluídas e canceladas, respeitando os estados e a auditoria. | P, D | Must |
| RF30 (alt.) | Mostrar a "última visita" na ficha do utente, calculada a partir do histórico, e indicar quando o utente ainda não tem visitas. | O campo existe na ficha do mockup e não deve depender de preenchimento duplicado. Um utente recém-admitido ainda não tem visitas e a interface não pode falhar por isso. | M | Must |
| RF31 (alt.) | Consultar histórico de visitas por utente, equipa, viatura e profissional, em ordem temporal, incluindo alterações de agendamento e ocorrências visíveis conforme permissões. | Permite auditar o planeamento e as visitas executadas sem expor dados fora do âmbito autorizado. | P, D | Must |
| RF32 (alt.) | Apresentar distância estimada da volta com método identificado e distância real apenas se houver leitura de odómetro ou GPS; quando desconhecida, indicar «não disponível» e não inferir um valor real. | Evita comparar estimativa geográfica com uma medição inexistente. | E | Should |

### 5.7 Informação de acompanhamento

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF33 (alt.) | Apresentar no Dashboard a pesquisa e ficha do utente, equipa responsável, médico assistente, prioridade e complexidade em campos distintos, mapa, filtros de urgência e indicadores agregados (utentes ativos, visitas planeadas/realizadas/pendentes, ausência de visita e quilómetros estimados). | Preserva o aspeto do Dashboard original e integra as informações acrescentadas após a reunião. | P, M, D | Should |
| RF34 (alt.) | Apresentar relatórios filtráveis por período, equipa e concelho; disponibilizar exportações CSV de relatórios e listagens de utentes quando autorizadas. | A exportação fica na prioridade Should para não tornar obrigatório um formato de ficheiro dentro do RF08, relativo à listagem e filtros. | P, M, E | Should |
| RF35 (alt.) | [BACKLOG] Exportar relatórios, plano do dia e, caso autorizado, ficha individual em PDF; suportar Excel/XLSX apenas após definir os campos e a necessidade real. Em exportações com dados clínicos, aplicar controlo de acesso e minimização. | A docente referiu PDF/Excel da ficha como possível funcionalidade não essencial; não confundir com a exportação CSV da listagem nem a exportação técnica do RF26. | E, D | Could |

### 5.8 Comunicação

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF36 | Enviar mensagens internas e notificações entre membros da equipa. | A introdução fala de necessidades de "comunicação da Unidade" e o mockup tem a secção "Mensagens". Não consta dos objetivos, por isso fica como *Could*. | M | Could |

### 5.9 Utilizadores e administração

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF37 (alt.) | Autenticar utilizadores com sessão expirada e aplicar autorizações por perfil, âmbito/equipa, utente e operação; verificar as permissões no servidor em consultas, edição de fichas, escalas, voltas, visitas e ocorrências clínicas. | A permissão não pode ser garantida por mostrar/esconder botões ou pelo seletor de perfil demonstrativo do React. | M, E, D | Must |
| RF38 (alt.) | Interface para gerir utilizadores e as suas permissões. Entretanto, os utilizadores de teste poderão ser providenciados pelo sistema centralmente. | Consequência de RF37. Numa equipa de quatro pessoas e quatro meses, a interface de gestão pode ficar para depois da autenticação base. | E | Should |
| RF39 (alt.) | Permitir configurar parâmetros de planeamento (horários habituais, origem/base, limiares sem visita, duração padrão por tipo de visita e/ou complexidade, alerta de duração suspeita), com registo de quem alterou e desde quando se aplica. | Os exemplos de 4 minutos ou 9h30–16h não são regras clínicas universais; devem ser parâmetros ou hipóteses. | M, E, D | Should |
| RF40 (alt.) | Carregar um conjunto de dados fictícios, com distribuição geográfica realista no Baixo Alentejo, de forma reproduzível: a mesma execução dá sempre os mesmos dados. | A proposta exige sandbox com dados fictícios. Sem dados verosímeis, não se testam o mapa, as distâncias nem a priorização. O mockup usa uma zona da área de Lisboa (Oeiras, Carnaxide), pelo que o conjunto de dados tem de ser construído de raiz para o Baixo Alentejo. | P | Must |
| RF41 (novo) | Importar utentes e visitas a partir de um ficheiro CSV com estrutura previamente definida e validada, apresentando um relatório das linhas rejeitadas. | A importação poderá facilitar o carregamento inicial ou a atualização dos dados. A estrutura e as regras de validação do CSV terão de ser definidas e confirmadas com a equipa da ULSBA (ponto 8.9). | U, E | Could |
| RF42 (novo) | Indicar de forma visível, em todas as páginas, que o ambiente é de teste com dados fictícios. | Evita confundir a sandbox com dados reais, sobretudo em demonstrações. | E | Should |

### 5.10 Voltas, ocorrências e controlo operacional — requisitos introduzidos na reunião de 28/10/2026

Estes requisitos complementam os RF01–RF42, sem os renumerar. A existência de uma interface de protótipo não garante implementação funcional da respetiva regra na API/BD.

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF43 (novo) | Gerir a **volta** como agenda identificada de uma equipa numa data, com estado, viatura, partida/regresso previstos e reais, sequência ordenada de paragens e visitas. Uma volta em rascunho pode estar vazia; uma volta confirmada pode conter **uma ou mais visitas**. | Exigir duas ou mais visitas excluiria voltas legítimas com apenas um utente. | D, E | Must |
| RF44 (novo) | No calendário, abrir o detalhe da volta com equipa, viatura, horários, lista de visitas ordenadas, informação da visita selecionada, mapa (diferenciando percurso real/ilustrativo), ocorrências e histórico; suportar ausência de horários reais ou distância medida. | Descreve o percurso Calendário → Volta → Visita → Utente sem assumir que dados não recolhidos estão disponíveis. | D, E | Must |
| RF45 (novo) | Registar ocorrências **operacionais da volta** e notas/ocorrências **da visita**, classificadas por visibilidade (operacional ou clínica), com autor e instante atribuídos pelo backend; permitir consulta e retificação auditada conforme permissão, sem edição silenciosa do histórico. | A reunião solicita rastreabilidade e uma separação de registos clínicos dos avisos operacionais. | D, E | Must |
| RF46 (novo) | Para instantes previstos e reais, recusar intervalos de duração negativa e, nas visitas concluídas, fim anterior/igual ao início. Calcular duração pelos instantes completos com fuso; durações positivas abaixo de limiar configurável (ex.: 4 min) desencadeiam aviso e confirmação, não bloqueio automático. | Distingue inconsistência objetiva de duração improvável; preserva correção de horas e fusos. | D, E | Must |
| RF47 (novo) | Após registar atraso, **propor** novas previsões para visitas seguintes da volta e mostrar conflitos de horários, recursos ou janelas; confirmar alterações antes de as gravar, mantendo histórico e preservando horas reais já registadas. | Atualizações automáticas silenciosas poderiam destruir evidência temporal e criar conflitos. | D, E | Should |
| RF48 (novo) | Registar ficha de viatura (identificação, tipo de motorização/energia, capacidade de lugares, autonomia quando aplicável e respetiva unidade, manutenção/revisões e intervalos de indisponibilidade); calcular disponibilidade para um período a partir de reservas e bloqueios. | Uma viatura «disponível agora» pode estar ocupada no horário de uma visita futura. | D, E | Should |
| RF49 (novo) | Aplicar o âmbito funcional de cada utilizador: profissionais consultam por omissão as suas equipas, voltas e utentes associados, e só editam o permitido; coordenadores autorizados têm vista geral. A ausência do filtro «Equipas» na agenda por utente é opção de interface, **não substitui** esta verificação de autorização. | Especifica a regra funcional que RNF02/RNF22 obrigam a proteger na API. | D, E | Must |

### 5.11 Critérios de aceitação dos requisitos Must

Os valores numéricos são metas de trabalho a validar. Os critérios abaixo cobrem os requisitos classificados como Must nesta revisão. A aprovação dos níveis de triagem, regras clínicas e tempos continua pendente da ULSBA.

| ID | Critério de aceitação |
|---|---|
| RF01 | Ao escrever 3 ou mais caracteres do nome ou do número, aparecem até 5 sugestões em menos de 1 segundo. Selecionar uma sugestão abre a ficha. |
| RF02 | A ficha apresenta identificação, local, equipa responsável, médico assistente, prioridade e complexidade separados, entre os restantes campos previstos. Um campo sem valor mostra «sem informação». O Dashboard apresenta «Equipa Responsável» em lugar de «Cuidador Principal». |
| RF03 | O botão Editar permite atualizar os campos autorizados e mostra o resultado após guardar; um profissional sem permissão não consegue alterar os dados nem através de pedido direto à API. Inativar preserva o histórico e retira o utente do planeamento por omissão. |
| RF04 | Marcar um ponto no mapa grava as coordenadas. Um ponto fora de Portugal continental, ou com latitude e longitude trocadas, é recusado com uma mensagem. |
| RF05 | Cada utente tem exatamente um local associado. Os locais do tipo lar ou unidade exigem nome. |
| RF06 | Um local pode ser partilhado por vários utentes. Alterar a morada ou as coordenadas do local reflete-se em todos os utentes desse local. |
| RF08 | A listagem apresenta coluna de complexidade e combina filtros por prioridade, estado, complexidade e última visita. Cada combinação atualiza o resultado; os critérios também são aplicados pela API, independentemente do frontend. |
| RF10 | Duas reavaliações de triagem em datas diferentes preservam data, autor e motivo; a mais recente é apresentada como prioridade atual, mesmo que seja menos urgente, sem eliminar as anteriores. |
| RF11 | Alterar um nível de triagem através dos parâmetros não obriga a alterar código e atualiza legenda/listagens; a complexidade IPCPAL mantém-se independente. |
| RF12 | A ficha e a lista apresentam complexidade separada da prioridade; é possível registar PPS e complexidade com autor e data, consultar o histórico e alterar estimativas de duração por complexidade sem alterar a ordem clínica de urgência. |
| RF15 | Cada marcador tem a cor do nível e a legenda tem texto. Com 500 utentes, o mapa carrega em menos de 3 segundos (RNF09). |
| RF16 | Cada filtro reduz em conjunto os marcadores e os contadores. Combinar filtros dá a interseção. |
| RF19 | Calendários mensal/semanal/diário e vistas Unidade/Utente/Profissional consistentes. Volta mostra saída e chegada; vista Utente mostra início/fim da visita sem filtro Equipa e sem restringir indevidamente resultados. Reagendamento/cancelamento mantêm histórico. |
| RF20 | Uma viatura indisponível por reserva ou manutenção no intervalo da volta não pode ser atribuída; a disponibilidade é verificada na API e no ecrã de planeamento. |
| RF21 | O servidor recusa conflitos de equipa, profissional, viatura e utente em períodos incompatíveis. Duas visitas no mesmo lar podem integrar uma paragem; sobreposição clínica só é permitida com profissionais/recursos adequados. Exceções de horário exigem confirmação e motivo. |
| RF23 | Cria-se visita sem data/hora, equipa e viatura, com estado pendente; a atribuição posterior muda para planeada, sem perder o histórico. |
| RF24 | Uma equipa com código próprio tem profissionais escalados num período, viatura atribuída por volta e participantes efetivos em cada visita. A agenda por profissional mostra apenas as visitas em que participa; é possível distinguir equipa responsável da executante. |
| RF26 | A exportação estruturada valida o contrato acordado com a docente de Matemática, minimiza identificadores pessoais e identifica coordenadas como dados reidentificáveis; quando a matriz de distâncias não está disponível, o erro/ausência é comunicado explicitamente, sem inventar valores. |
| RF29 | Uma visita pendente/planeada não exige horários reais. Ao concluir, tem equipa, participantes, início e fim reais válidos, duração calculada e autoria confiável; cancelamento exige motivo. |
| RF30 | Um utente sem visitas realizadas mostra "sem visitas" e não provoca erro. Depois de registar uma visita, a última visita atualiza-se sem ser preciso preencher o campo à mão. |
| RF31 | O histórico filtra por utente, equipa, viatura e profissional, apresenta os registos do mais recente ao mais antigo e pode ser aberto a partir da ficha ou da volta, mediante autorização. |
| RF37 | Sessão inválida e requisições de utilizador sem permissão são rejeitadas pelo backend, inclusive pedidos HTTP diretos. Acesso e edição obedecem à matriz por perfil, equipa, utente e tipo clínico. |
| RF40 | Executar o carregamento de dados de demonstração recria sempre o mesmo conjunto base realista, com utentes distribuídos pelos concelhos do Baixo Alentejo. |
| RF43 | Uma volta rascunho pode ter 0 visitas; uma confirmada aceita 1 ou mais, sem perder associação de paragens, equipa, viatura e horários ao editar. |
| RF44 | Abrir volta e selecionar visita devolve os dados da volta correta, inclusive estado vazio/dados ainda não recolhidos; mapas ilustrativos são identificados e a distância real só aparece quando medida. |
| RF45 | Notas clínicas e ocorrências operacionais ficam separadas; autor/instante são atribuídos pela API, alteração deixa trilho e não é possível falsificar autoria nem consultar registos de outra equipa sem permissão. |
| RF46 | A API rejeita fim anterior/igual ao início para visita concluída; o cálculo atravessa meia-noite e mudança de hora usando instantes. Duração breve acima de zero mostra aviso configurável e pede confirmação, sem rejeitar automaticamente. |
| RF49 | Uma conta de profissional não consulta/edita dados não atribuídos por URL direta nem pedido API. A vista Utente não mostra filtro Equipa, mantendo as mesmas restrições de autorização. |

---

## 6. Requisitos não funcionais

Os valores numéricos são metas de trabalho, não compromissos contratuais. As funcionalidades sugeridas em reunião podem ter implementação apenas visual no frontend até estarem ligadas à API e às migrações. Não há na proposta números de utentes ou de utilizadores; partimos de uma ordem de grandeza (centenas de utentes, poucos utilizadores em simultâneo) que deve ser confirmada.

### 6.1 Segurança e proteção de dados

| ID | Requisito | Justificação | Origem | Prior. | Verificação |
|---|---|---|---|---|---|
| RNF01 (alt.) | Só dados fictícios no desenvolvimento e nos testes. A estrutura de dados deverá guardar apenas o necessário para o planeamento e o acompanhamento. | Os dados de saúde são categoria especial no RGPD (art. 9.º). A proposta usa a sandbox precisamente para proteger dados pessoais e clínicos. Limitar os campos já agora evita problemas se o sistema vier a passar a produção. | P | Must | Inspeção do modelo de dados e do script de dados de demonstração. |
| RNF02 (alt.) | Autenticação obrigatória, palavras-passe com hash criptográfico adequado (ex.: Argon2id ou bcrypt), sessão/token com expiração e autorização na API por perfil, operação e equipa/utente atribuído. | A ocultação de botões no frontend não protege informação clínica. Um pedido direto ao backend deve ser igualmente recusado quando não autorizado. | E, D | Must | Testes autenticados e não autenticados aos endpoints, incluindo acesso transversal entre equipas e expiração de sessão. |
| RNF03 | Comunicação cifrada (HTTPS) sempre que a plataforma seja acedida fora da máquina de desenvolvimento. Segredos e credenciais fora do repositório Git. | O repositório é partilhado no GitHub. Uma credencial enviada por engano para o repositório fica no histórico mesmo depois de apagada. | E | Must | Inspeção do `.gitignore` e do histórico do repositório. |
| RNF04 (alt.) | Persistir trilho de auditoria das operações críticas (triagens, autorizações, alterações à ficha, horários, ocorrências e volta), com autor autenticado, instante, entidade e operação; impedir alteração arbitrária da autoria pelo cliente. | O histórico e a autoria foram explicitamente solicitados na reunião e não podem ser opcionais quando há notas clínicas. | E, D | Must | Criar/editar uma ocorrência e um horário, verificar o histórico persistido e tentar forjar o autor no pedido HTTP. |
| RNF22 (alt.) | Aplicar mínimo privilégio por perfil, equipa, utente e sensibilidade do campo em todas as operações de API; administrador sem acesso clínico, coordenador com acesso transversal só se autorizado e profissional limitado ao âmbito atribuído. | É necessário para satisfazer RF03, RF37, RF45 e RF49. | E, D | Must | Matriz de permissões e testes de autorização cruzada por equipa e tipo de registo. |
| RNF23 (novo) | Definir prazos de conservação e um mecanismo de eliminação ou anonimização dos dados dos utentes inativos. | O RF03 diz "sem apagamento físico", mas o RGPD prevê limites de conservação e o direito ao apagamento. Em produção, os dois têm de ser conciliados. | E | Should | Inspeção do procedimento documentado. |
| RNF24 (novo) | As exportações para o algoritmo de rotas não devem conter dados identificativos diretos. | Protege os dados fora do sistema. Liga-se ao RF26. | E | Must | Inspeção do ficheiro exportado. |
| RNF25 (novo) | Proteção contra os riscos mais comuns de aplicações web: consultas parametrizadas (sem montar SQL a partir de texto do utilizador), validação das entradas e limite de tentativas de início de sessão. | O RNF02 trata das palavras-passe e da sessão, mas não destes riscos. | E | Should | Revisão do código contra a lista OWASP Top 10, com consultas parametrizadas ou ORM. |

### 6.2 Usabilidade e acessibilidade

| ID | Requisito | Justificação | Origem | Prior. | Verificação |
|---|---|---|---|---|---|
| RNF05 (alt.) | Permitir tarefas frequentes com poucos passos, incluindo procurar utente, consultar uma volta, introduzir horários reais e registar uma ocorrência. Meta de trabalho: concluir o registo de uma visita em menos de dois minutos. | O fluxo da docente procura simplificar o trabalho dos profissionais durante as visitas. | P, E, D | Should | Teste de usabilidade temporizado nos percursos Utente → Visita e Agenda → Volta → Registo. |
| RNF06 (alt.) | Garantir utilização responsiva das operações essenciais em desktop, tablet e telemóvel: pesquisa/ficha, agenda/voltas, mapa, visitas e registo de horários/ocorrências, sem elementos sobrepostos, campos inacessíveis ou perda de ações. | A docente enfatizou a utilização móvel; foram observadas sobreposições reais entre ficha/mapa e barra inferior do Dashboard. | E, D | Must | Testar larguras de referência 360, 768 e 1440 px com calendário e Dashboard; verificar scroll, navegação e ausência de sobreposições. |
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
| RNF12 (alt.) | Validar dados no cliente e no servidor, aplicar restrições na base de dados (FK, unicidade, CHECK, transações) e validar coerência temporal: fim após início, intervalos de recursos sem conflitos e duração não negativa; durações suspeitas geram aviso e confirmação. | Formulários React não substituem verificações na API/BD. O limiar de «quatro minutos» é exemplo para alerta, não regra clínica universal. | E, D | Must | Testar horários inválidos por API, duração suspeita, conflitos de recursos e falha a meio de uma operação composta. |
| RNF13 (alt.) | A base de dados deverá ser recriável de forma limpa a partir de *scripts* automáticos (ex: ferramentas de migração) e dados genéricos de ensaio. Cópias de segurança regulares são apenas recomendação para produção. | Em sandbox, o que importa é a fiabilidade da infraestrutura partilhada de desenvolvimento. | E | Should | Recriar a base de dados do zero em menos de 10 minutos. |
| RNF14 (alt.) | Disponibilidade durante o horário de atividade da equipa (aproximadamente 8h–18h em dias úteis) como recomendação para produção. Em sandbox não há requisito de disponibilidade. | Não há requisito formal na proposta, e um nível de serviço de 24 horas seria desproporcionado para este contexto. | E | Could | Não aplicável em sandbox. |
| RNF26 (novo) | Guardar **instantes** (início/fim de visita, partida/regresso, autoria) como `timestamptz` ou equivalente que preserve o instante; guardar datas sem componente horária (nascimento, referência, revisão, se aplicável) como `date`. Converter para `Europe/Lisbon` na interface. | Evita erros na mudança de hora sem transformar datas civis em instantes UTC arbitrários. | E | Must | Inspeção do modelo de dados (por exemplo, o tipo `timestamptz`). |
| RNF27 (novo) | Guardar coordenadas em WGS84/SRID 4326 e validar longitude/latitude e território aprovado; os limites territoriais oficiais ainda têm de ser disponibilizados/confirmados pela ULSBA. | O limite geográfico provisório não pode excluir automaticamente casos reais sem validação institucional. | E | Must | Teste com pontos inválidos, que a base de dados deve recusar. |

### 6.5 Manutenibilidade, testes e documentação

| ID | Requisito | Justificação | Origem | Prior. | Verificação |
|---|---|---|---|---|---|
| RNF15 (alt.) | Código organizado em componentes de interface reutilizáveis, páginas, estado/serviços, regras de negócio e acesso a dados; TypeScript no frontend e modelos tipados na API. Não considerar o estado React em memória como persistência final. | A evolução da Agenda, detalhes da volta e Dashboard exige reutilização sem duplicar regras clínicas ou de autorização. | P, E, D | Should | Revisão estrutural do repositório e teste de integração frontend–API para operações de criação/edição. |
| RNF17 | API testada com ferramentas de validação de endpoints (ex: Postman). Regras de prioridade e de planeamento cobertas com testes. | A proposta nomeia ferramentas de endpoint validation. As regras de negócio são o ponto crítico do sistema. | P, E | Must | Evidência de coleções de testes ou execução CI. |
| RNF18 | API documentada (ex: OpenAPI), arquitetura geral e modelo de dados documentados. | A proposta inclui documentação técnica entre as competências a desenvolver. | P | Must | Inspeção da documentação da API e do diagrama entidade-relação. |
| RNF28 (novo) | O esquema da base de dados deve ser versionado com migrações. O modelo, o diagrama e o dicionário de dados devem ser atualizados em conjunto com cada alteração. | Sem versionamento, cada programador acaba com uma base de dados diferente. | E | Must | Inspeção das migrações e da documentação do modelo de dados. |

### 6.6 Portabilidade e interoperabilidade

| ID | Requisito | Justificação | Origem | Prior. | Verificação |
|---|---|---|---|---|---|
| RNF19 | Ambiente reproduzível com contentores (ex: Docker) e configuração por variáveis de ambiente. | Ambiente colaborativo heterogéneo exige base comum. | E | Must | Todos os membros conseguem arrancar o ambiente com um só comando. |
| RNF20 | API REST desacoplada da interface, suportando formatos estandardizados (JSON, CSV). | Facilita a ligação ao algoritmo de otimização de rotas, que pode estar noutra linguagem. | P | Must | Inspeção da especificação da API e teste das exportações. |
| RNF21 | Compatibilidade com as duas últimas versões dos navegadores atuais (Chrome, Edge, Firefox, Safari). | A ULSBA pode usar dispositivos e navegadores que a equipa não testa por omissão. | E | Should | Teste nos quatro navegadores. |

O RNF16 da versão 0.1 (Git, GitHub, Conventional Commits e *pull requests*) passou para a secção 7, porque é uma regra de trabalho da equipa e não uma qualidade do sistema. Os RNF04, RNF06 e RNF22 passam a *Must* nesta proposta de versão 0.3, sujeitos à validação do âmbito.

---

## 7. Restrições

- **Prazo e equipa.** De outubro de 2026 ao início de fevereiro de 2027, com três ou quatro estudantes. Parte da equipa trabalha em simultâneo, o que reduz a capacidade real. Por isso se separou com cuidado o que é essencial (*Must*) do que pode ficar para o fim. Os requisitos mais pesados são o RF04, o RF21 e o RF37. Se as estimativas de esforço não couberem no prazo, são os primeiros candidatos a simplificação.
- **Dados.** Apenas dados fictícios, em ambiente sandbox. Não serão utilizados dados pessoais ou clínicos reais nesta fase.
- **Integração.** Sem ligação aos sistemas da ULSBA nesta fase.
- **Arquitetura.** Web, cliente-servidor, assente em tecnologias de persistência estruturada relacional.
- **Cartografia.** Integração orientada a Leaflet e OpenStreetMap (proposta). Os mapas base do OpenStreetMap têm limites de tráfego que, para a sandbox, servirão; a longo prazo sugerem fornecedor alternativo.
- **Geocodificação.** A conversão de moradas em coordenadas (RF09) usa um serviço externo, que também tem política de utilização e limite de pedidos. Os resultados devem ser guardados para não repetir pedidos.
- **Convenções de desenvolvimento.** Controlo de versões com Git e GitHub, *commits* segundo a convenção Conventional Commits e alterações integradas por *pull request* (antigo RNF16). A convenção torna o histórico legível para quem não escreveu o código.
- **Algoritmo.** Concebido pela docente de Matemática, fora do controlo da equipa informática. A construção manual de agendas/voltas continua disponível sem esse algoritmo; qualquer rota simulada deve estar identificada como protótipo.

## 8. Pontos em aberto

Questões que devem ser fechadas na próxima reunião de acompanhamento ou diretamente com a ULSBA e com a docente de Matemática. Cada uma altera requisitos concretos no desenho.

1. **Modelo final de prioridade e complexidade.** A reunião distinguiu urgência (ordem de atendimento) de complexidade (apoio à duração). Continuam por validar os níveis de triagem usados no mapa, os prazos de visita, a relação entre PPS e IPCPAL e a estimativa de duração por complexidade (RF10–RF14, RF19, RF22 e RF39).
2. **Regras de planeamento e equipas.** Confirmar horário habitual (hipótese 9h30–16h), regresso a Beja, pausas, números de recursos, disponibilidade e durações. Confirmar se cada utente mantém a mesma equipa responsável e em que exceções a equipa executante/viatura ou composição da equipa pode mudar (RF19–RF24, RF43, RF48 e RF49).
3. **Dados mínimos na ficha.** Confirmar diagnósticos/notas imprescindíveis, médico assistente, atribuição de equipa responsável e necessidade de guardar um contacto de cuidador separadamente. Quais profissionais podem consultar e editar cada campo? (RF02, RF03, RF37, RF49, RNF01 e RNF22).
4. **Âmbito do algoritmo.** Confirmar com a docente de Matemática se haverá integração nesta fase, formato dos dados e critérios de aceitação da proposta. A criação manual mantém-se obrigatória. Uma rota ilustrativa no frontend não satisfaz RF27 (RF19, RF26–RF28 e RF47).
5. **Fonte das distâncias.** Linha reta, serviço de encaminhamento externo ou motor próprio? Condiciona lógicas de processamento do espaço (RF17, RF25 e RF32).
6. **Utilização no terreno.** Confirmar quais tarefas serão feitas em telemóvel (horários reais, ocorrências, consulta do mapa), requisitos mínimos de responsividade e eventual necessidade futura de suporte offline, atualmente fora do âmbito (RF45, RF46 e RNF06).
7. **Mensagens e notificações.** Existe necessidade real de comunicação dentro da plataforma? O que representa o número no sino do mockup? Afeta desenho do chat e interações (RF13 e RF36).
8. **Números de referência.** Quantos utentes ativos, quantos utilizadores simultâneos? Afeta dimensionamento e testes de carga (RNF09 e RNF10).
9. **Estrutura dos dados para importação.** Confirmar com a ULSBA, sem partilha de dados pessoais, os campos necessários, os tipos de dados, os valores permitidos e as regras de validação do CSV. Como devem ser representados o género e o local? Afeta a modelação dos dados e a importação (RF02, RF05 e RF41).
10. **Registo de visitas e ocorrências.** Quem regista e confirma horas reais, com que data/hora e possibilidade de correção? Que notas são clínicas vs. operacionais, que motivos de cancelamento existem e quem os consulta? Confirmar limiar de alerta para durações suspeitas e tratamento de visitas breves (RF29, RF45, RF46 e RNF04).
11. **Estados do utente e reavaliações.** Que estados existem (referenciado, admitido, alta, óbito)? Um utente pode ser readmitido? Com que frequência se reavaliam a triagem, o PPS e o IPCPAL? Afeta histórico e campos de estado (RF10 e RF07).
12. **Lares e unidades.** Quantos utentes se visitam por cada ida a um lar ou unidade, e quanto dura uma visita coletiva? Qual é o concelho da unidade de Montemor admitida no Anexo A? Afeta estruturação da relação local-utente e planeamento (RF05, RF21 e RF06).
13. **Conservação dos dados.** Por quanto tempo se guardam os dados de utentes inativos e o que acontece depois? Afeta compliance de integridade referencial (RF03 e RNF23).
14. **Perfis e permissões.** Confirmar matriz de leitura/edição por campo, equipa e profissional, visibilidade de coordenadas/notas clínicas, exceções dos coordenadores e acesso à informação de voltas alheias. A autorização tem de ser aplicada no servidor (RF03, RF37, RF45, RF49, RNF02 e RNF22).
15. **Validação das hipóteses de trabalho.** Todas as hipóteses do Anexo A (triagem A/B/C, classificação IPCPAL, horário das visitas, viaturas e equipas, tipos de local e campos do utente), bem como as sugestões da reunião da docente, têm de ser confirmadas operacionalmente com a ULSBA. Afeta todos os requisitos com origem U ou D.

16. **Atualização por atrasos.** Confirmar se uma equipa pode aceitar novas previsões diretamente ou se o coordenador valida; que conflitos e notificações devem aparecer e como guardar versões do plano (RF47).
17. **Viaturas e manutenção.** Confirmar categorias de combustível, unidade da autonomia (km, percentagem/energia), datas e periodicidades de revisão, responsável pelas indisponibilidades e se autonomia condiciona ou apenas alerta o planeamento (RF20, RF21 e RF48).
18. **Vistas e terminologia da agenda.** Confirmar se «Unidade» corresponde ao calendário geral; se a equipa responsável pelo utente é fixa e se existem exceções que justifiquem filtro por equipa na vista Utente; confirmar estados e horários que devem aparecer no cartão mensal (RF19, RF24, RF43 e RF44).
19. **Ocorrências e histórico.** Validar tipos de ocorrências, possibilidade de editar registos já guardados, correções por adenda e perfis com acesso ao histórico; confirmar política de auditoria (RF45, RF46, RNF04 e RNF23).

## 9. Rastreabilidade

Cada objetivo da proposta tem de ter pelo menos um requisito que o realize.

| Objetivo | Requisitos funcionais |
|---|---|
| O1 Aceder à informação relevante dos utentes | RF01, RF02, RF03, RF05, RF06, RF07, RF08, RF31 |
| O2 Georreferenciar e visualizar a distribuição geográfica | RF04, RF09, RF15, RF16, RF17, RF18 |
| O3 Definir e atualizar prioridades de atendimento | RF10, RF11, RF12, RF13, RF14 |
| O4 Apoiar o planeamento da agenda de visitas e viaturas | RF19, RF20, RF21, RF22, RF23, RF24, RF25, RF26, RF27, RF28, RF43, RF44, RF47, RF48 |
| O5 Registar as visitas domiciliárias | RF29, RF30, RF31, RF32, RF45, RF46 |
| O6 Sistematizar e disponibilizar informação de acompanhamento | RF26, RF33, RF34, RF35 |
| Suporte transversal (acessos, dados de teste, comunicação, importação) | RF36, RF37, RF38, RF39, RF40, RF41, RF42, RF49 |

Os requisitos não funcionais não realizam um objetivo, protegem a forma como os objetivos são cumpridos. Ligam-se aos requisitos funcionais assim:

| Requisitos não funcionais | Protegem |
|---|---|
| RNF01, RNF22, RNF23, RNF24 (dados e privacidade) | RF02, RF03, RF26, RF40, RF45, RF49 |
| RNF02, RNF03, RNF25 (acesso e segurança) | RF03, RF37, RF38, RF45, RF49 |
| RNF04 (auditoria) | RF03, RF10, RF29, RF45, RF46, RF47 |
| RNF05, RNF06, RNF07, RNF08 (usabilidade) | RF01, RF15, RF19, RF29, RF33, RF44, RF46 |
| RNF09, RNF10, RNF11 (desempenho e escala) | RF15, RF16, RF20, RF43, RF48 |
| RNF12, RNF13, RNF26, RNF27 (integridade) | RF04, RF19, RF21, RF29, RF43, RF46, RF47 |
| RNF14 (disponibilidade, só como recomendação para produção) | Todos |
| RNF15, RNF17, RNF18, RNF19, RNF28 (qualidade da construção) | Todos |
| RNF20, RNF21 (interoperabilidade) | RF26, RF27, RF34, RF43 |

### 9.1. Decisões de âmbito e rastreabilidade da revisão técnica (v0.3)

| Tema | Decisão proposta | Estado |
|---|---|---|
| Urgência / triagem | Hierarquia clínica configurável distinta da complexidade | **A validar com a ULSBA** |
| Complexidade / PPS | Registo, apresentação e histórico separados; estima duração | Princípio sugerido pela docente; parâmetros **por validar** |
| Equipa responsável | Campo na ficha; composição por período; atribuição temporal | Proposta técnica; exceções **por validar** |
| Agenda por utente | Horário da visita; sem filtro de equipas | Alinhado com os exemplos do frontend/reunião |
| Voltas e paragens | Volta pode conter uma visita; paragem pode agrupar utentes | Correção técnica necessária |
| Conflitos | Equipa, profissional, viatura e utente; não confundir mesmo local com simultaneidade clínica | Regra de integridade proposta |
| Atrasos | Proposta de replaneamento com confirmação e histórico | Sugestão da docente; algoritmo **por validar** |
| PDF/Excel | Opcional, não integrar no caminho crítico | Backlog |
| Geocodificação automática | Não bloqueante | Backlog |
| Importação CSV/Mensagens/heurística | Não centrais à reunião | Backlog, manter IDs históricos |
| Algoritmo de otimização | Exportação RF26 obrigatória; integração RF27 condicionada | Validar com docente de Matemática |
| Estado de implementação | Interface com dados em memória não comprova persistência/segurança | Exige testes API + BD |

**Regra de versionamento:** não reutilizar IDs eliminados; se a equipa aprovar retirar um RF, registar «Retirado do âmbito desta versão» com motivo, sem renumerar ou reaproveitar o código. Assim, PRs, diagramas e relatórios não ficam com referências inconsistentes.

---

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
3. **Complexidade (hipótese da v0.2, ainda não validada).** Admitiu-se a classificação IPCPAL: altamente complexo, complexo e não complexo, e uma possível relação com o PPS. Esta relação não está demonstrada nem deve ser automatizada sem validação clínica. Na presente versão, o PPS e a complexidade são registados separadamente (RF12 e RF14).
4. **Dados do utente.** Admite-se que a ficha tem nome, número de utente, datas de referenciação, de triagem e de admissão, idade, género, concelho, local, morada, localidade, contacto telefónico e coordenadas. Admite-se que o local é a casa do utente, um lar ou uma unidade (por exemplo, em Serpa ou em Montemor), com estado ativo ou inativo e histórico de visitas.
5. **Horário.** Admite-se que as visitas decorrem entre as 9h30 e as 16h e que às 16h as equipas estão de volta a Beja.
6. **Viaturas e equipas.** Admite-se que há duas viaturas, ou seja, duas equipas em simultâneo, e que o território é o Baixo Alentejo.

---

## Anexo B. Registo das propostas da reunião de 28/10/2026

Este anexo separa as **sugestões da docente**, os requisitos documentados e a situação da implementação. Não declara funcionalidades prontas apenas por existirem ecrãs React com dados fictícios.

| Página | Sugestão registada | Requisitos relacionados | Situação para validação |
|---|---|---|---|
| Dashboard | Manter pesquisa/ficha/mapa e substituir «Cuidador Principal» por «Equipa Responsável»; apresentar médico assistente. | RF02, RF33 | Definir equipa responsável vs. executante da visita. |
| Utentes | Edição autorizada, prioridade separada da complexidade, coluna e filtros (prioridade, estado, complexidade, última visita); melhor experiência móvel. | RF03, RF08, RF10–RF12, RF37, RNF06 | Confirmar matriz de campos editáveis e critérios clínicos. |
| Utentes | Exportar ficha em PDF ou Excel. | RF35 | Opcional (*Could*), condicionado a permissões. |
| Equipas | Separador específico; profissionais, viatura, códigos A/B/C e acesso às próprias voltas. | RF20, RF24, RF49 | Confirmar estabilidade das equipas e exceções de acesso. |
| Viaturas | Listagem, características, combustível/autonomia, lugares, disponibilidade, revisões e reparações. | RF20, RF48 | Confirmar campos e calendário de indisponibilidade. |
| Agenda | Planeamento manual; algoritmo como proposta, aceite/ajustado por utilizador quando disponível. | RF19, RF26, RF27 | Integração do algoritmo continua pendente de definição de âmbito. |
| Agenda | Calendário mensal com perspetivas Unidade, Utente e Profissional; início/fim dos eventos; selecionar volta para detalhe. | RF19, RF43, RF44 | Confirmar significado dos horários e exceções à equipa responsável fixa. |
| Volta | Cabeçalho, visitas ordenadas, mapa, ocorrências gerais, histórico e horários previstos/reais. | RF43–RF45 | Esclarecer fonte das distâncias e visibilidade clínica. |
| Visitas | Criação pendente/planeada, edição dos instantes reais, duração, alerta de valores suspeitos, ocorrências com autor e atrasos. | RF23, RF29, RF45–RF47, RNF12 | Confirmar quem pode corrigir horários e regras de confirmação. |

### Dependências para implementação além do frontend

- **API:** autorização por perfil/equipa/campo, endpoints para utentes, voltas, visitas, ocorrências, viaturas e disponibilidade; regras de validação temporal e deteção de conflitos.
- **Modelo de dados e migrações:** equipa responsável do utente, registos de atribuição e composição; voltas/paragens/visitas; instantes previstos/reais em `timestamptz`; ocorrências com autor e histórico; características e períodos de indisponibilidade das viaturas; prioridades e complexidade separadas.
- **Frontend:** integrar os formulários com API, tratar erros e permissões devolvidos pelo servidor, conservar a interface responsiva e identificar claramente qualquer simulação de rota.
- **Testes:** cobrir autorização cruzada, horários inválidos, visitas suspeitamente curtas, sobreposição de recursos, filtro por utente e recalculação de previsões com confirmação.
