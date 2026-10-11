# Especificação de Requisitos

**Plataforma de Apoio à Equipa de Serviços Integrados de Cuidados Paliativos da ULSBA**

| | |
|---|---|
| Unidade curricular | Projecto Integrado 2026-2027, Licenciatura em Engenharia Informática (IPBeja, ESTG) |
| Tutora | Elsa Rodrigues |
| Versão | 0.1, rascunho para validação |
| Data | 10 de outubro de 2026 |

---

## 1. Enquadramento

A Equipa de Cuidados Paliativos da ULSBA presta cuidados ao domicílio num território extenso e com população dispersa, com poucos meios. Para decidir quem visitar, quando e em que viatura, os profissionais recorrem hoje a vários sistemas que não comunicam entre si. A proposta pede uma plataforma web que junte essa informação num único sítio e apoie o planeamento e o registo das visitas.

Este documento fixa o que a plataforma deve fazer (requisitos funcionais) e com que qualidade o deve fazer (requisitos não funcionais). A proposta pede que a escolha de tecnologias seja fundamentada nos requisitos funcionais e não funcionais, e este documento serve de base a essa fundamentação.

Nem todos os requisitos têm o mesmo grau de certeza. A proposta e o mockup dão uma base firme, mas a própria proposta diz que os critérios de prioridade e as regras de planeamento têm de ser definidos e validados com a equipa da ULSBA. O que ainda depende dessa validação está assinalado e reunido na secção 8.

## 2. Âmbito

**Dentro do âmbito desta fase**

- Consulta e gestão da informação dos utentes (todos fictícios).
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

## 3. Utilizadores

A proposta não define perfis de utilizador, mas o mockup mostra uma sessão da enfermeira coordenadora. Partimos de três perfis, a confirmar com a ULSBA.

| Perfil | O que faz na plataforma |
|---|---|
| Coordenador | Gere prioridades, monta a agenda, atribui viaturas, consulta relatórios. |
| Profissional de saúde | Consulta fichas, vê o plano do dia, regista visitas. |
| Administrador | Gere utilizadores, parâmetros e dados de referência. |

## 4. Convenções

**Prioridade (MoSCoW).** *Must* é indispensável para a entrega de fevereiro. *Should* entra se o prazo o permitir. *Could* é desejável, mas dispensável. Nada foi classificado como *Won't*; o que fica de fora está na secção 2.

**Origem.** Indica de onde vem o requisito, para ser possível defendê-lo.

| Código | Significado |
|---|---|
| P | Proposta de Projeto |
| M | Mockup |
| U | Informação recolhida junto da ULSBA, a confirmar por escrito |
| E | Decisão da equipa, deduzida do contexto, a validar |

---

## 5. Requisitos funcionais

### 5.1 Gestão de utentes

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF01 | Pesquisar um utente por número ou por nome, com sugestões à medida que se escreve. | O mockup tem os dois campos de pesquisa. Os nomes repetem-se muito (a lista de exemplo tem quatro "Maria Teresa"), por isso o número serve para desambiguar. | M | Must |
| RF02 | Consultar a ficha do utente: identificação, data de nascimento, contacto, cuidador principal, morada e coordenadas, médico assistente, situação clínica, data da última visita, notas e estado. | É o primeiro objetivo da proposta e o painel central do mockup. | P, M | Must |
| RF03 | Criar, editar e inativar utentes, sem apagamento físico. | A ficha tem um estado ("Ativo"). Um utente que sai do acompanhamento deixa de entrar no planeamento, mas o histórico de visitas tem de se manter. | M, E | Must |
| RF04 | Georreferenciar o utente a partir da morada e permitir corrigir o ponto à mão no mapa. | A população é dispersa e muitas moradas rurais não são resolvidas bem por geocodificação automática. Sem coordenadas certas, mapa e rotas não servem. | P | Must |
| RF05 | Registar o tipo de local do utente (domicílio ou lar/unidade) e o concelho. | Há utentes em lares e unidades além de casas particulares (Serpa e Montemor, por exemplo), com implicações no acesso e na duração da visita. | U | Should |

### 5.2 Prioridades de atendimento

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF06 | Atribuir e atualizar a prioridade de cada utente, guardando data, autor e motivo de cada alteração. | Objetivo 3 da proposta. O histórico permite perceber porque é que um utente passou a urgente e quando. O mockup prevê a atualização a partir do painel de prioridade, com reflexo imediato no mapa. | P, M | Must |
| RF07 | Manter os níveis de prioridade numa tabela configurável, sem alterar código. | O mockup usa cinco níveis em dias (urgente 0, 1 e 2 dias; não urgente 1 e 2). A ULSBA trabalha com triagem A, B, C e não urgente. A proposta diz que os critérios têm de ser validados com a equipa, por isso o modelo tem de aguentar mudanças. | P, M, U | Must |
| RF08 | Registar o PPS do utente e derivar a classificação de complexidade (altamente complexo, complexo, não complexo). | A priorização na ULSBA assenta no PPS e na classificação IPCPAL. A regra de conversão tem de ser confirmada pela equipa clínica. | U | Should |
| RF09 | Assinalar utentes cujo prazo de visita está a esgotar-se sem visita registada. | O mockup tem um sino de notificações e uma contagem de urgentes. Sem alerta, a prioridade fica só informativa. | M, E | Should |

### 5.3 Mapa

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF10 | Mostrar os utentes num mapa (Leaflet e OpenStreetMap), com marcadores coloridos por prioridade e legenda. | Objetivo 2 da proposta, desenhado no mockup. | P, M | Must |
| RF11 | Filtrar o mapa por prioridade, concelho, tipo de local e estado. | O mockup tem o botão "Filtrar Utentes". Num território com vários concelhos, ver todos os pontos de uma vez deixa de ser útil. | M | Must |
| RF12 | Mostrar indicadores do conjunto visível: utentes no mapa, urgentes, não urgentes e distância total aproximada. | Barra inferior do mockup. | M | Should |
| RF13 | Abrir a ficha do utente ao selecioná-lo no mapa. | Evita repetir a pesquisa quando já se está a trabalhar sobre o mapa. | E | Should |

### 5.4 Agenda e viaturas

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF14 | Criar, reagendar e cancelar visitas, com vista diária e semanal. | Objetivo 4 da proposta e secção "Agenda" do menu. Como não há dias fixos de visita, a agenda tem de aceitar alterações constantes. | P, M, U | Must |
| RF15 | Gerir as viaturas e as equipas, e associar equipas a viaturas por dia. | A proposta fala de "agenda de visitas e viaturas". A operação atual usa duas viaturas, cada uma com a sua equipa. | P, U | Must |
| RF16 | Atribuir visitas a uma viatura e validar as restrições: horário de visitas das 9h30 às 16h, regresso a Beja às 16h, sem sobreposição de visitas na mesma viatura. | São as regras de planeamento que a ULSBA descreveu. A plataforma deve avisar de um plano impossível e não o aceitar em silêncio. | U | Must |
| RF17 | Propor, para um dia, a lista de utentes a visitar ordenada por prioridade, que o coordenador pode ajustar. | Corresponde ao botão "Ver Lista de Utentes". É uma ajuda de planeamento que não depende do algoritmo. | M | Should |

### 5.5 Rotas

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF18 | Mostrar no mapa a rota planeada de cada viatura, com a ordem das paragens e a distância estimada. | Permite ao coordenador ver o dia de cada equipa antes de o confirmar. | M, E | Should |
| RF19 | Exportar, em formato estruturado (JSON ou CSV), os dados de que o algoritmo precisa: utentes com coordenadas, prioridades, duração prevista das visitas, viaturas, ponto de partida e janela horária. | A proposta diz que, nesta fase, se contempla "apenas a possibilidade de extração dos dados" para o algoritmo. É o mínimo obrigatório da componente de rotas. | P | Must |
| RF20 | Integrar o algoritmo de otimização e importar o resultado como proposta de plano editável. | O botão "Gerar Rota Ótima" está no mockup, mas a proposta situa o algoritmo numa fase futura, ainda que mais adiante atribua à equipa a sua integração. Fica como *Could* até se esclarecer o ponto 8.4. Até lá, o botão fica visível mas inativo. | P, M | Could |

### 5.6 Registo de visitas

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF21 | Registar uma visita: data, hora de início e fim, equipa, viatura, resultado (realizada ou não, com motivo) e notas. | Objetivo 5 da proposta. | P | Must |
| RF22 | Atualizar automaticamente a "última visita" na ficha do utente ao registar uma visita. | O campo existe na ficha do mockup e não deve depender de preenchimento duplicado. | M | Must |
| RF23 | Consultar o histórico de visitas por utente, equipa e viatura. | Sem histórico não há acompanhamento da atividade (objetivo 6). | P | Must |
| RF24 | Registar os quilómetros percorridos por viatura e por dia. | A proposta quer melhorar a eficiência de um serviço com poucos recursos. Os quilómetros são o indicador mais direto para comparar planeamento manual e otimizado. | E | Should |

### 5.7 Informação de acompanhamento

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF25 | Painel inicial com indicadores: utentes ativos por prioridade, visitas planeadas e realizadas, visitas fora de prazo, quilómetros. | Objetivo 6. O painel é a página de entrada do mockup. | P, M | Should |
| RF26 | Relatórios filtráveis por período, equipa e concelho, exportáveis em PDF e CSV. | A secção "Relatórios" está no menu do mockup e a proposta pede informação "sistematizada e disponibilizada". | P, M | Should |

### 5.8 Comunicação

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF27 | Enviar mensagens internas e notificações entre membros da equipa. | A introdução fala de necessidades de "comunicação da Unidade" e o mockup tem a secção "Mensagens". Não consta dos objetivos, por isso fica como *Could*. | M | Could |

### 5.9 Utilizadores e administração

| ID | Requisito | Justificação | Origem | Prior. |
|---|---|---|---|---|
| RF28 | Autenticação com perfis (coordenador, profissional, administrador). | Mesmo em sandbox, o desenho deve refletir o uso real: nem todos podem alterar prioridades ou ver tudo. | M, E | Must |
| RF29 | Gerir utilizadores e as suas permissões. | Consequência de RF28. | E | Must |
| RF30 | Parametrizar horário de visitas, ponto de partida, duração média por tipo de visita e níveis de prioridade. | Menu "Configurações". Evita escrever regras da ULSBA no código, que ainda podem mudar. | M, E | Should |
| RF31 | Carregar um conjunto de dados fictícios, com distribuição geográfica realista no Baixo Alentejo. | A proposta exige sandbox com dados fictícios. Sem dados verosímeis, não se testam o mapa, as distâncias nem a priorização. O mockup usa uma zona da área de Lisboa (Oeiras, Carnaxide), pelo que o conjunto de dados tem de ser construído de raiz para o Baixo Alentejo. | P | Must |

---

## 6. Requisitos não funcionais

Os valores numéricos são metas de trabalho, não compromissos contratuais. Não há na proposta números de utentes ou de utilizadores; partimos de uma ordem de grandeza (centenas de utentes, poucos utilizadores em simultâneo) que deve ser confirmada.

### 6.1 Segurança e proteção de dados

| ID | Requisito | Justificação | Origem |
|---|---|---|---|
| RNF01 | Só dados fictícios no desenvolvimento e nos testes. A estrutura de dados guarda apenas o necessário para o planeamento e o acompanhamento. | Os dados de saúde são categoria especial no RGPD (art. 9.º). A proposta usa a sandbox precisamente para proteger dados pessoais e clínicos. Limitar os campos já agora evita problemas se o sistema vier a passar a produção. | P |
| RNF02 | Autenticação obrigatória, palavras-passe guardadas com *hash* adequado (Argon2 ou bcrypt), sessões ou tokens com expiração e acesso limitado por perfil. | A sandbox deve comportar-se como o sistema real, para que a passagem a produção não obrigue a refazer o controlo de acessos. | E |
| RNF03 | Comunicação cifrada (HTTPS). Segredos e credenciais fora do repositório Git. | O repositório é partilhado no GitHub. Uma credencial enviada por engano para o repositório fica no histórico mesmo depois de apagada. | E |
| RNF04 | Registo de auditoria das consultas e alterações a fichas de utentes (quem, quando, o quê). | Em dados clínicos é preciso poder saber quem viu ou alterou um registo. | E |

### 6.2 Usabilidade e acessibilidade

| ID | Requisito | Justificação | Origem |
|---|---|---|---|
| RNF05 | As tarefas frequentes (encontrar um utente, ver a ficha, registar uma visita) devem ser feitas em poucos passos. Meta de trabalho: registar uma visita em menos de dois minutos. | Os utilizadores são profissionais de saúde com pouco tempo. A fase 3 inclui testes de usabilidade, que precisam de um critério para dizer se passaram ou não. | P, E |
| RNF06 | Interface utilizável em computador, tablet e telemóvel. | As equipas trabalham em deslocação. Basta uma aplicação web responsiva; uma aplicação nativa fica fora do âmbito. | E |
| RNF07 | Interface em português europeu, datas no formato dd/mm/aaaa e fuso horário de Lisboa. | Utilizadores e contexto institucional portugueses. | E |
| RNF08 | A prioridade nunca depende só da cor: cada nível tem também ícone ou texto, e os contrastes cumprem WCAG 2.1 AA. | No mockup, os marcadores do mapa distinguem os cinco níveis apenas pela cor. Uma pessoa com daltonismo não distinguiria, por exemplo, laranja de vermelho no mapa. | E |

### 6.3 Desempenho e escala

| ID | Requisito | Justificação | Origem |
|---|---|---|---|
| RNF09 | Pesquisa de utente e abertura da ficha em até 1 segundo; mapa com 500 utentes carregado em até 3 segundos, usando agrupamento de marcadores se necessário. | O mockup tem 24 utentes, mas o dimensionamento não deve ficar apertado ao exemplo. | E |
| RNF10 | O modelo de dados e a arquitetura permitem acrescentar viaturas, equipas e concelhos sem reestruturação. | Hoje são duas viaturas; é razoável que a unidade cresça. | E |
| RNF11 | Interrogações geográficas (utentes por zona, distâncias) apoiadas em índices espaciais. | Evita que o mapa e os filtros degradem à medida que os dados crescem. | E |

### 6.4 Fiabilidade e disponibilidade

| ID | Requisito | Justificação | Origem |
|---|---|---|---|
| RNF12 | Validação dos dados no cliente e no servidor, com restrições de integridade na base de dados e operações compostas feitas em transação. | Uma visita registada pela metade (sem atualizar a última visita, por exemplo) deixa o planeamento errado sem ninguém dar por isso. | E |
| RNF13 | Cópias de segurança diárias da base de dados e procedimento de restauro documentado e testado pelo menos uma vez. | Só um restauro testado garante que a cópia serve. | E |
| RNF14 | Disponibilidade durante o horário de atividade da equipa (aproximadamente 8h–18h em dias úteis). Fora dele, aceita-se manutenção. | Não há requisito formal na proposta, e um nível de serviço de 24 horas seria desproporcionado para este contexto. | E |

### 6.5 Manutenibilidade, testes e documentação

| ID | Requisito | Justificação | Origem |
|---|---|---|---|
| RNF15 | Código separado em camadas (interface, lógica de negócio, acesso a dados), em TypeScript no *frontend* e com tipagem no *backend*. | Equipa de quatro pessoas a trabalhar em paralelo: fronteiras claras reduzem conflitos e facilitam a integração (fase 3). | P, E |
| RNF16 | Controlo de versões com Git e GitHub, *commits* em inglês segundo a convenção Conventional Commits e alterações integradas por *pull request*. | A proposta pede Git e GitHub. A convenção torna o histórico legível para quem não escreveu o código. | P, E |
| RNF17 | API testada com Postman. Regras de prioridade e de planeamento com testes automáticos. | A proposta nomeia o Postman. As regras de negócio são o ponto onde um erro tem mais consequências. | P, E |
| RNF18 | API documentada em OpenAPI, modelo de dados e arquitetura descritos, e relatórios intermédios segundo as normas do IPBeja. | A proposta inclui documentação técnica entre as competências a desenvolver. | P |

### 6.6 Portabilidade e interoperabilidade

| ID | Requisito | Justificação | Origem |
|---|---|---|---|
| RNF19 | Ambiente reproduzível com contentores (Docker) e configuração por variáveis de ambiente. | Quatro máquinas diferentes e uma sandbox: o ambiente tem de ser igual para todos. | E |
| RNF20 | API REST desacoplada da interface, com exportação em formatos abertos (JSON, CSV). | A proposta admite integração com sistemas da ULSBA numa fase posterior e prevê extração de dados para o algoritmo. Uma API limpa facilita ambas. | P |
| RNF21 | Compatibilidade com as duas últimas versões dos navegadores atuais (Chrome, Edge, Firefox, Safari). | Desconhece-se o navegador usado na ULSBA; esta é a hipótese mais segura. | E |

---

## 7. Restrições

- **Prazo e equipa.** De outubro de 2026 ao início de fevereiro de 2027, com três ou quatro estudantes. Parte da equipa trabalha em simultâneo, o que reduz a capacidade real. Por isso se separou com cuidado o que é essencial (*Must*) do que pode ficar para o fim.
- **Dados.** Apenas fictícios, em sandbox.
- **Integração.** Sem ligação aos sistemas da ULSBA nesta fase.
- **Arquitetura.** Web, cliente-servidor, com base de dados relacional (proposta).
- **Cartografia.** Leaflet e OpenStreetMap (proposta). Os mapas base do OpenStreetMap têm uma política de utilização que obriga a atribuição e limita o tráfego. Para a sandbox chega, mas um serviço em produção teria de usar outro fornecedor de mapas ou servidor próprio.
- **Ferramentas.** Git, GitHub e Postman (proposta).
- **Algoritmo.** Concebido pela docente de Matemática, fora do controlo da equipa.

## 8. Pontos em aberto

Questões que devem ser fechadas na próxima reunião de acompanhamento ou diretamente com a ULSBA e com a docente de Matemática. Cada uma altera requisitos concretos.

1. **Modelo final de prioridades.** Os níveis em dias do mockup, a triagem A/B/C da ULSBA e a classificação IPCPAL a partir do PPS são três modelos diferentes. Qual manda, e que prazo de visita corresponde a cada nível? Afeta RF06 a RF09.
2. **Regras de planeamento.** Confirmar horário (9h30 às 16h), regresso a Beja às 16h, número de viaturas e equipas, duração média por tipo de visita e eventuais pausas. Afeta RF15, RF16 e RF30.
3. **Dados mínimos na ficha.** O mockup mostra diagnósticos e notas clínicas. Que campos a equipa precisa mesmo de ver para planear? Afeta RF02 e RNF01.
4. **Âmbito do algoritmo.** A proposta diz, numa passagem, que a integração é futura e, noutra, que compete à equipa integrá-lo. Se for nesta fase, RF20 sobe para *Should* e o calendário muda. Afeta RF19 e RF20.
5. **Fonte das distâncias.** Linha reta, serviço de encaminhamento externo ou motor próprio? Condiciona RF12, RF18 e RF24. A docente de Matemática poderá dizer o que o algoritmo exige.
6. **Utilização no terreno.** As equipas vão consultar a plataforma no telemóvel durante as visitas? Se sim, a cobertura de rede no Baixo Alentejo pode obrigar a considerar funcionamento sem ligação, hoje fora do âmbito. Afeta RNF06.
7. **Mensagens.** Existe necessidade real de comunicação dentro da plataforma, ou a equipa já usa outro canal? Afeta RF27.
8. **Números de referência.** Quantos utentes ativos, quantos utilizadores simultâneos? Afeta RNF09 e RNF14.

## 9. Rastreabilidade

Cada objetivo da proposta tem de ter pelo menos um requisito que o realize. Os objetivos seguem a ordem em que aparecem na proposta, onde não estão numerados.

| Objetivo da proposta | Requisitos |
|---|---|
| Aceder à informação relevante dos utentes | RF01, RF02, RF03, RF05, RF23 |
| Georreferenciar e visualizar a distribuição geográfica | RF04, RF10, RF11, RF12, RF13 |
| Definir e atualizar prioridades de atendimento | RF06, RF07, RF08, RF09 |
| Apoiar o planeamento da agenda de visitas e viaturas | RF14, RF15, RF16, RF17, RF18, RF19, RF20 |
| Registar as visitas domiciliárias | RF21, RF22, RF23, RF24 |
| Sistematizar e disponibilizar informação de acompanhamento | RF19, RF25, RF26 |
| Suporte transversal (acessos, dados de teste, comunicação) | RF27, RF28, RF29, RF30, RF31 |

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