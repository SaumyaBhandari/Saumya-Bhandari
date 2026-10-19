## 1. Two people walk into the same sentence {#two-banks}

Read this sentence slowly: **He went to the bank.** Where did he go?

You probably pictured a building with a counter, an ATM, and somebody waiting to deposit money. Or perhaps you pictured the edge of a river. The sentence allows both. Now let me add a few words, and watch what happens to the picture in your head.

::: {.example #example-01}
### Example 01 · The bank that changes halfway through

“He went to the bank, and he deposited some money.” Now the building makes sense. “He went to the bank, and he nearly drowned.” Now a riverbank is the more natural interpretation. Neither continuation makes the other reading logically impossible: somebody could have an accident inside a bank. Context changes what is likely. Also notice the timing: before you hear the ending, you must keep the ambiguity alive; afterwards, you can revise your interpretation.
:::

::: {.example #example-02}
### Example 02 · A cup on a football pitch

“The final whistle blew. He got the cup.” Picture a trophy held above someone's head. “We walked into the ceramics aisle. He got the cup.” Picture a drinking vessel taken from a shelf. The short sentence stays the same. The situation supplies the interpretation. This is the starting example of my paper, *Context-Lifted Predictive States*.
:::

::: {.example #example-03}
### Example 03 · A bat in two rooms

“There was a bat in the shed.” A cricket player might look for a wooden bat; a wildlife rescuer might look up at the rafters. “It flew out through the window” supplies a new clue. A useful thinking machine should be able to update its guess as clues arrive, including when an earlier guess turns out to be wrong.
:::

::: {.example #example-04}
### Example 04 · The mouse beside your laptop

“The mouse stopped working” fits an electronic device. “The mouse stopped eating” fits an animal. You know more than a dictionary definition: you have expectations about what different kinds of things can do. In the paper, a system of such categories is called an **ontology**. That imposing word can begin with distinctions as ordinary as person, animal, object, place, and event.
:::

My question is about the machinery that holds those distinctions together. Could a language machine become more economical if it explicitly maintained the situation, the open contexts, and the people or objects being discussed? The paper develops a precise version of that question. It contains mathematical results for carefully defined systems and hypotheses that still require experiments on real language.

The phrase **context lift** means turning a history of observations into an explicit structured state. It does not mean travelling to a higher physical dimension. Imagine keeping a small, continuously updated scene notebook while reading a story. The notebook records whatever could matter next.

<!-- FIGURE:bank -->

## 2. What the machine is allowed to know {#causal-state}

A prediction has a deadline. If I ask you to guess the ending of a sentence, you may use the words already spoken. You may not secretly read the ending first. A model that builds its “current context” from a complete novel and then predicts earlier passages is cheating at this particular task, even if its answers sound impressive.

::: {.example #example-05}
### Example 05 · The mystery novel

On page ten, a detective has found a muddy shoe and an open window. On page two hundred, the gardener confesses. A page-ten predictor can remember the shoe and window. It cannot label the gardener as guilty using the later confession. Once that confession actually arrives, updating the state is perfectly legitimate.
:::

::: {.example #example-06}
### Example 06 · The voice message still arriving

Your friend says, “Meet me at the…” and the connection pauses. Knowing you planned to swim makes “pool” plausible; knowing you booked train tickets makes “station” plausible. Your current prediction comes from what has arrived so far. A recording you will receive tomorrow is outside today's information.
:::

<!-- EQ:1 -->

Now suppose two people keep different notes about the same conversation. One writes every word; the other writes “Ravi owes Maya a blue pen and will return it on Friday.” For some questions, the shorter note may be enough. For others, it may fail.

::: {.example #example-07}
### Example 07 · Remembering a promise

“Ravi borrowed Maya's blue pen. He said he would return it on Friday.” If the question is “Who should bring the pen on Friday?”, a note about borrower, owner, object, and deadline may preserve everything needed. If the question is “Which exact words did Ravi use?”, that same note is insufficient. Enough information always means enough for a specified question.
:::

::: {.example #example-08}
### Example 08 · A game saved halfway through

Imagine a simple board game whose next legal moves depend only on the board and whose turn it is. Saving those facts can be enough to resume play. If a special rule also depends on an earlier move, you must save that fact too. A summary becomes sufficient by preserving the dependencies of the task, not by being short or elegant.
:::

<!-- EQ:2 -->

**Predictive sufficiency** is the exact version of “my notes retain everything relevant to what comes next.” It is a demanding property. Keeping a generally useful summary is easier than proving that the complete history could never improve the required prediction.

## 3. Organising information does not create information {#information-and-cost}

This is the first important boundary of the idea. If useful information was never present in what you observed, rearranging your notes cannot manufacture it. If it was present and you delete it, the future may become harder to predict. A well-designed representation tries to retain the relevant information in a form that is easier to use.

::: {.example #example-09}
### Example 09 · The missing departure time

“Our bus leaves from Gate 4 at 7:30.” You shorten this to “Gate 4.” You still know where to stand, but you have lost the departure time. The full message can improve a prediction about when to leave home. That remaining advantage is what the paper calls residual information in the history.
:::

::: {.example #example-10}
### Example 10 · The same timetable, two layouts

One timetable is an unsorted list of every bus. Another groups the same entries by destination and time. Both contain the same facts. Finding your bus may take much less work in the second. This is an analogy for the paper's central distinction: how much information exists, and how expensive it is for a particular kind of machine to use it.
:::

<!-- EQ:3 -->
<!-- EQ:4 -->
<!-- EQ:5 -->

The proof is bookkeeping. A note computed entirely from a transcript adds no new evidence when placed beside that transcript. Then we split the transcript's predictive information into the part accessible through the note and the part still useful after reading the note. The second part is zero only when the note is sufficient for the target.

::: {.example #example-11}
### Example 11 · Remembering who has the ball

A scoreboard can display the same sequence of match events as a commentator's notebook. A state that explicitly records the current score and ball possession may answer certain questions faster. But somebody has to watch the events and keep that state updated. The work of creating the convenient summary belongs in the bill.
:::

::: {.example #example-12}
### Example 12 · The shopping-list accountant

Suppose an app claims to sort your shopping in one millisecond. It quietly sends every item to an expensive service that classifies products first. You would count that service when judging the app's efficiency. The paper makes the same demand for language: count the encoder, memory updates, and output generator together.
:::

<!-- EQ:6 -->

Here **realization** simply means building a machine that performs the prediction. The cheapest realization depends on which tools that machine is allowed to use. A stack, an entity register, or a learned network can change that calculation. None receives a free pass on memory, running time, or the cost of constructing its inputs.

## 4. A small working world: what, inside what, involving whom? {#three-parts}

The proposed state has three parts. **Local state** is what is currently going on in the prediction. **Context frames** keep track of enclosing situations. **Referent registers** keep track of the particular people and objects that remain relevant. A referent is just the thing a word or phrase points to.

::: {.example #example-13}
### Example 13 · Ordering momo

“The waiter took our order. He brought it ten minutes later.” The local event changes from ordering to delivery. The restaurant context supplies expectations about menus, food, and payment. The referents include the waiter, the customers, and the order. “He” and “it” need different kinds of targets even though both are short words.
:::

::: {.example #example-14}
### Example 14 · Your friend's Minecraft story

“In my Minecraft world, the house exploded. Back at home, Dad asked why I was shouting.” The house belongs to the game story. Dad belongs to the surrounding real-life story. Understanding the passage requires keeping those contexts distinct while allowing the game event to explain the real-world shouting. The proposed frames give such distinctions an explicit place.
:::

<!-- EQ:7 -->

<!-- FIGURE:state -->

The symbols are a proposed design, not a scan of three compartments in the human brain. A machine could realize these roles using many different mechanisms. Giving a number array three dimensions would not, by itself, make those dimensions acquire the intended meanings.

::: {.example #example-15}
### Example 15 · The same cup, two routes into meaning

“At the football final, the captain received the cup” activates an event, a sport, a match, and a presentation. “At the department store, the customer bought the cup” activates commerce, shopping, and ceramics. The paper writes these as two possible chains of frames. They illustrate useful contextual organization; a category taxonomy alone does not prove that a real-time parser has found the correct push and pop operations.
:::

<!-- EQ:8 -->
<!-- EQ:9 -->

::: {.example #example-16}
### Example 16 · Two possible people

“Ravi stood beside Nikhil. He lifted the cup.” Even if we know this is a trophy presentation, “he” remains ambiguous. A good state can retain uncertainty over both the person and the object's sense. It should not turn a likely interpretation into a certainty simply because the architecture has a labelled slot waiting to be filled.
:::

<!-- EQ:10 -->

## 5. How much does a clue actually help? {#value-of-context}

Consider prediction as assigning confidence to possible answers. A machine that gives the correct answer a tiny probability receives a large penalty under **logarithmic loss**. A well-calibrated machine tries to assign probabilities that match how often outcomes really happen. The paper asks how much the best achievable average penalty falls when context becomes available.

::: {.example #example-17}
### Example 17 · “She served an ace”

Without a setting, “ace” could suggest a playing card or a tennis serve. “She stepped onto the tennis court” makes a sporting interpretation more likely. The helpfulness of that clue can be measured by how much it improves predictions across many such cases. One lucky correct guess is not the quantity being measured.
:::

::: {.example #example-18}
### Example 18 · An irrelevant ceiling

“He went to the bank. The ceiling somewhere nearby was white.” This clue may tell us almost nothing about the intended sense of “bank.” A longer context is not automatically more informative about a particular target. The ideal predictor can ignore irrelevant information; a limited trained model may still become distracted by it.
:::

<!-- EQ:11 -->

The **Bayes-optimal** predictor is an ideal benchmark that knows the true relevant probabilities. The theorem concerns that benchmark, averaged over the task's distribution. It does not promise that adding text will improve every real model or every individual prediction.

::: {.example #example-19}
### Example 19 · Clues arriving one layer at a time

Start with “He got the cup.” Add “There was an event,” then “It was a sporting event,” then “It was the football final.” The first clue may help little; the next two may help much more. A later clue is credited only for what it adds beyond the earlier clues. Repeating “football” five times should not count as five independent discoveries.
:::

<!-- EQ:12 -->

::: {.example #example-20}
### Example 20 · A story that changes its mind

“We were at the football stadium. He got the cup. It was full of tea.” The stadium initially favours a trophy interpretation, but the tea pushes back towards a drinking cup. A clue can reduce confidence in one candidate. The information signal tracks this revision; it is not required to keep climbing for every possible interpretation.
:::

<!-- EQ:13 -->
<!-- EQ:14 -->

::: {.example #example-21}
### Example 21 · A useful restaurant summary

“Maya ordered vegetarian momo; Ravi ordered chicken momo.” A summary retaining each person's order may be enough to predict who receives which plate. A summary saying only “Two people ordered food” loses a distinction that matters. Both summaries are short; only one preserves the information needed for this target.
:::

::: {.example #example-22}
### Example 22 · A beautiful but useless graph

Imagine an app turning the restaurant conversation into a smooth blue wave. It looks impressive. If the wave cannot tell us which plate belongs to Maya, its appearance is no evidence of understanding. The paper's criterion is whether the representation preserves the predictions we need. The same applies to a three-dimensional tensor or an attractive visualisation.
:::

<!-- EQ:15 -->

## 6. Stories inside stories {#nested-context}

Some situations open inside other situations. You pause one task, do a smaller task, and return. Computer scientists call the most recently opened, first closed organization a **stack**. Think of keeping your place in several nested activities.

::: {.example #example-23}
### Example 23 · The maths question inside the homework

You are doing homework. One question requires a formula, so you open a reference book. One word in the book is unfamiliar, so you check its meaning. Then you return to the formula, then the question, then the homework. A stack can record those return points. It does not need a fresh unrelated rule for every possible sequence of interruptions.
:::

::: {.example #example-24}
### Example 24 · Who believes the door is locked?

“Maya thinks that Ravi believes the door is locked.” This tells us about Ravi's belief as represented in Maya's belief. It does not establish that the door really is locked. Closing the inner discussion should restore the outer perspective. A system that pours every mentioned claim into one undifferentiated fact store can confuse belief with truth.
:::

<!-- FIGURE:stack -->

::: {.example #example-25}
### Example 25 · A quotation inside a message

“Asha texted, ‘Ravi said, “I lost my keys.”’ Then she called him.” The word “I” belongs to Ravi's quoted speech. After both quotations close, “she” returns us to Asha in the surrounding narration. The spelling of a pronoun is small; the bookkeeping required to interpret it can involve several open layers.
:::

::: {.example #example-26}
### Example 26 · A conversation that crosses its own threads

Your group chat discusses homework, then a football match, then someone answers a homework question from twenty messages earlier while the football discussion continues. That is awkward for a single strict stack. The paper explicitly allows that graphs or other richer structures may be needed. Its first theorem studies a well-nested component, not every possible shape of conversation.
:::

The next section uses brackets because brackets give us a tiny world in which the rules are perfectly clear. Real people do not helpfully announce “opening belief frame” every time they speak. Discovering that structure from ordinary sentences is part of the work a future implementation must perform.

## 7. Why brackets can require different kinds of machinery {#bracket-proof}

::: {.example #example-27}
### Example 27 · Matching school-maths brackets

“[ ( ) ]” closes the round bracket before the square bracket. “[ ( ] )” tries to close them in the wrong order. A stack remembers the opening bracket on top and checks whether the next closing bracket matches it. This simple procedure works at increasing depths, although the memory needed to hold the stack grows with depth.
:::

::: {.example #example-28}
### Example 28 · Packing boxes inside boxes

You open a red box, then a blue box inside it. To undo the sequence, you close blue before red. If you open blue then red, the required closing order changes. The names of the colours are incidental; remembering their ordered types is essential. This is the intuition behind the proof's different prefixes and matching suffixes.
:::

A **Hankel matrix** is a big compatibility table. Rows contain possible beginnings, columns contain possible endings, and each cell asks whether joining its beginning and ending gives an acceptable whole. **Rank** measures how many independent row or column patterns the table needs over the chosen number system. It is not a synonym for model parameter count.

<!-- EQ:16 -->
<!-- FIGURE:hankel -->
<!-- EQ:17 -->
<!-- EQ:18 -->
<!-- EQ:19 -->

The proof pairs every length-\(k\) opening sequence with exactly one reversed matching closing sequence. Different pairs demand different answers. The resulting subtable has ones down its diagonal and zeros elsewhere. At two types and depth two, it contains four independent patterns. At depth three, eight. Since the language allows arbitrarily deep nesting, there is no finite upper ceiling on the ordinary rank.

::: {.example #example-29}
### Example 29 · A lookup chart versus a notebook stack

For every possible nesting depth up to two, you could draw a fixed chart of cases. Allow more depth and the number of distinguishable pending sequences expands. A stack-based procedure uses a finite set of instructions but can keep a longer stack. “Finite machine description” therefore does not mean “fixed total memory for an arbitrarily long input.”
:::

<!-- EQ:20 -->

::: {.example #example-30}
### Example 30 · The instruction hidden before the last ten words

At the start of a game, you are told either “Answer red” or “Answer blue,” chosen equally often. Ten identical filler words follow. A player allowed to see only those last ten words cannot do better than a half on average. A player who saved the opening instruction can answer perfectly. With \(m\) equally likely instructions, the suffix-only ceiling is \(1/m\).
:::

The paper formalises that last example as a history \(c_Ix^L\): an opening type \(I\), followed by \(L\) identical filler observations, followed by a required matching return \(r_I\). “Remember the password, then hear ten identical beeps” is another instance. “Remember the requested drink, then hear twenty identical announcements” is a third. The limited observer sees the same suffix in every case; the saved state retains the differentiating fact.

The separation is between the specified computational classes. It does **not** show that attention-based or recurrent neural systems cannot remember nesting. It also does not prove that English behaves like brackets, or that the theoretical stack will run faster on real hardware.

## 8. Who matters more than the spelling of a name {#reference}

::: {.example #example-31}
### Example 31 · Rename the characters

“Maya lent Ravi a book. Ravi returned it to Maya.” Change every Maya to Tara and every Ravi to Nima. The book travels through the same pattern of roles. A structural question such as “Did the borrower return the book to the lender?” keeps its answer. A question asking for the lender's literal name must change its answer to Tara.
:::

::: {.example #example-32}
### Example 32 · Two people who share a role

“Asha and Sita are both teachers. Asha lost her umbrella; Sita found it.” Storing only “teacher” loses the distinction between owner and finder. The machine needs persistent identities as well as categories. Replacing a specific person with a type label is a more destructive operation than consistently renaming that person.
:::

<!-- EQ:21 -->
<!-- EQ:22 -->

The formal symmetry treats names as arbitrary labels within their declared types. In ordinary life, a famous name can bring relevant knowledge: replacing “Ronaldo” with a person who has never played football changes what we know. The mathematical comparison must preserve relevant attributes, roles, and facts rather than silently swapping biographies. It tests dependence on arbitrary spelling, not independence from all identity-related knowledge.

::: {.example #example-33}
### Example 33 · A classroom seating chart

Imagine assigning each active participant a slot. “Maya entered” creates a person in slot 1. “Ravi entered” creates another person in slot 2. “Maya sat down” refers back to slot 1. Internally, the last event can use “same as slot 1.” Exact string equality is easy here; recognizing that “the new student” means Maya would require an additional interpretation step.
:::

<!-- EQ:23 -->

<!-- FIGURE:register -->

::: {.example #example-34}
### Example 34 · The guest who returns after being forgotten

A memory system holds only three active guests. It evicts Maya after she leaves, and eventually retains no record of her. Much later, “Maya returned” arrives. Under this paper's bounded register semantics, the name is treated as new if it matches no live slot. The theorem does not quietly grant unlimited recognition of everyone ever mentioned.
:::

::: {.example #example-35}
### Example 35 · Keeping an unfinished promise pinned

You are discussing Ravi's promise while briefly talking about a delivery. A saved frame still points to Ravi's slot, so that slot must remain protected from reuse. Otherwise the delivery driver might overwrite it, and returning to the promise would attach it to the wrong person. A slot must remain pinned while any active frame still needs it; if nothing can be safely evicted, that is a resource limit.
:::

The canonicalization proof follows the two renamed stories together, one observation at a time. A one-to-one renaming preserves both equality and inequality. If the same finite allocation rule is used, both stories produce the same new-versus-existing codes. Induction means repeating that argument after every step. This proof assumes the specified equivariant update discipline; it does not solve the harder problem of learning perfect entity recognition from raw text.

## 9. A finite set of relationship patterns {#finite-realization}

::: {.example #example-36}
### Example 36 · Two labels, one person

Suppose slots 1 and 2 can hold the same person. The arrangement “same person in both slots” differs from “two different people,” even if the printed names change. Mathematicians call the groups of equal slots a partition. Bell numbers count possible partitions; for two slots, the two patterns are “together” and “separate.”
:::

::: {.example #example-37}
### Example 37 · An enormous but finite school catalogue

A school catalogue with finitely many classrooms, students, activities, and status flags has finitely many possible combinations. That total could still be far too large to store explicitly. The paper's counting argument establishes finiteness under its assumptions. Whether the resulting representation is small enough to be useful is a further question.
:::

<!-- EQ:24 -->
<!-- EQ:25 -->

To understand the main structured-realization theorem, imagine choosing one local-control setting, one discrete predictive setting, and one canonical register arrangement. Those choices give a finite combined controller. Context frames also use finite labels and pointers. After the input has been causally labelled as call, return, or internal, this can be organized as a weighted visibly-pushdown machine under the paper's assumptions.

The accompanying nested-rank statement is a bound of \(n^2\), where \(n\) counts canonical control states. For a hypothetical two-state realization, the claimed bound is four; for a hypothetical three-state realization, it is nine. These are conditional mathematical counts, not measured neural-network sizes. The stack itself may still become arbitrarily deep unless a separate depth budget is imposed.

The assumptions matter: finite local and discrete predictive settings; finite structural alphabets; visible operations after the lift; a global live-name budget with protected pointers; symmetry-respecting transitions and structural outputs; and finite transition/output weights. A continuous coordinate with unlimited precision cannot simply be counted as one finite discrete setting. A huge or expensive context encoder cannot be ignored either.

## 10. What happens when the notebook fills up? {#resource-limits}

::: {.example #example-38}
### Example 38 · Too many players to track

Your football commentary state has room for four live players, but the next exchange depends on six. Evicting somebody may make a later “he” harder to resolve. The question is how often this happens as the budget grows: four slots, eight slots, sixteen slots. The theory asks for that curve, not an unsupported announcement that four is always enough.
:::

::: {.example #example-39}
### Example 39 · A belief inside too many beliefs

“Asha thinks Ravi suspects Maya believes Nima lied.” A system with room for only two explicit nested perspectives may overflow. A system with a larger depth budget may preserve more of the distinctions. Real discourse also has ambiguous and crossing relations, so merely increasing depth does not fix every interpretive error.
:::

::: {.example #example-40}
### Example 40 · A category missing from the notebook

A game assistant knows people, weapons, doors, and coins. A new expansion introduces a portal that is both a location and a transport mechanism. Its retained categories may be inadequate for the task. Ontology budget is about the distinctions the representation can express; adding more categories can help, but the correct organization must also be learned or supplied.
:::

<!-- EQ:26 -->

::: {.example #example-41}
### Example 41 · A confident mistake with a capped penalty

An imaginary predictor assigns only one chance in a million to the ending that actually appears. Ordinary log loss penalizes that severely. The paper uses a clipped loss with a probability floor so its worst single-example penalty is bounded. This is an analysis device; it does not mean the original probability was accurate or that ordinary unbounded log loss has the same guarantee.
:::

<!-- EQ:27 -->
<!-- EQ:28 -->

::: {.example #example-42}
### Example 42 · Three ways to run out of room

A reading app may fail because too many people are active, because the story is too deeply nested, or because a required category is missing. Sometimes two failures happen together. Adding their separate probabilities gives a safe upper bound on the chance of at least one, even though it can overcount those overlaps. That is the union-bound step in the proof.
:::

<!-- EQ:29 -->
<!-- EQ:30 -->

The strongest assumption here is easy to miss: outside the stated overflow and approximation errors, the bounded predictor must agree with the ideal predictor. A real model can still misread a sentence, learn the wrong rule, or use a bad ontology while every memory slot is available. Those errors are not automatically covered by the overflow theorem. A practical evaluation must measure them too.

## 11. Knowing the event still leaves the words to choose {#lexical-barrier}

::: {.example #example-43}
### Example 43 · Three ways to say somebody left

“She left.” “She departed.” “She headed out.” These can describe similar events, yet their exact words differ. Predicting an event type may be easier than predicting the precise expression a writer will choose. The paper keeps structural prediction and lexical prediction separate because success at the first does not automatically settle the second.
:::

::: {.example #example-44}
### Example 44 · A colour is coming, but which one?

“She chose the…” may make a colour word likely in a controlled task. Even after identifying that category, the model may still need to choose among “red,” “blue,” “green,” and many others. If all four were equally likely, two bits of uncertainty would remain inside that category. Knowing a bucket is different from knowing its exact member.
:::

<!-- EQ:31 -->
<!-- EQ:32 -->

For the stated identity, the category must be a deterministic coarsening of the predicted token, or of the token together with fixed history. A word like “bank” does not carry a uniquely determined sense by spelling alone. A toy dictionary that assigns every word one fixed category satisfies the simple assumption; real semantic annotations need more care. If the structural variable is independently uncertain, the simple two-term expression needs an additional correction term.

The implication for thinking machines is practical. A compact account of who did what may be valuable while fluent wording remains expensive. That would be an interesting partial result. It would not demonstrate that all language generation can be compressed into a tiny state.

## 12. Three hypotheses, three separate chances to fail {#hypotheses}

::: {.example #example-45}
### Example 45 · Strong memory, expensive storyteller

Suppose an experimental machine tracks nested beliefs accurately and survives consistent character renaming, but producing natural sentences still requires an enormous decoder. It could support H1, the nesting hypothesis, and H2, the reference-symmetry hypothesis, while failing H3, the end-to-end efficiency hypothesis. The paper deliberately separates those outcomes.
:::

::: {.example #example-46}
### Example 46 · Two phones on different budgets

One phone runs a predictor faster but uses more memory; another uses less memory but gives slightly worse predictions. There may be no single winner across all budgets. A performance–cost frontier records the best trade-offs. H3 requires a genuine improvement in that comparison once the entire pipeline is counted, rather than one flattering result at one chosen setting.
:::

In everyday language, **H1** asks whether explicit nested memory saves resources for some long-range dependencies. **H2** asks how much entity-related prediction depends on equality, role, and type rather than arbitrary name spelling. **H3** asks whether the complete machine actually achieves a better prediction–cost trade-off than appropriate comparison systems. These remain hypotheses about English and implemented systems.

The paper draws on established work: discourse focus spaces, discourse referents, frame semantics, predictive states, information theory, and structured automata. Its proposed contribution is how those pieces are assembled around bounded resources and testable costs. The references in Part II retain the original bibliography. This article does not claim that stacks, symmetry, or the information identities were invented here.

## 13. The appendices: count the patterns, then measure what survives {#appendices}

Appendix A expands the state-counting argument. You count which slots are occupied, which occupied slots refer to the same entity, the allowed types and attributes, and which slots are pinned. Multiplying generous upper bounds proves that the total is finite under finite budgets. It can substantially overcount impossible combinations.

<!-- EQ:33 -->

::: {.example #example-47}
### Example 47 · How much of the full-history advantage remains?

Imagine a local-only predictor has cross-entropy 5, a state-assisted predictor scores 3.5, and a full-history predictor scores 3, all in the same units on the same targets. The state captures 1.5 of the full history's observed 2-point advantage: a ratio of 0.75. These are invented teaching numbers, not results reported by this paper.
:::

<!-- EQ:34 -->

::: {.example #example-48}
### Example 48 · Give the transcript back

Ask a machine to answer using its structured notes. Then give it the original transcript as well. If performance improves substantially, something useful was missing from the notes or inaccessible to their predictor. If performance does not improve, that is encouraging only when the transcript-assisted model is capable enough to exploit useful evidence. A weak comparison model can hide the missing information.
:::

<!-- EQ:35 -->

The ratios are estimator-dependent measurements. They become exact information quantities only under the stated optimal-prediction conditions. A tiny or zero denominator makes the capture ratio unstable or undefined. Trained models can yield values outside zero to one, so the ratio should be accompanied by its underlying losses and uncertainty, not presented as a universal percentage of understanding.

## 14. How to give the idea an honest examination {#experiments}

::: {.example #example-49}
### Example 49 · Deliberately break the relationships

Take a story whose correct interpretation depends on nested quotations. Scramble its nesting markers while preserving many of its words. Separately, consistently rename its characters without altering their roles. A structure-sensitive system should be harmed by destroying relevant nesting and should preserve the tested structural answers under valid renaming. If neither intervention changes anything, perhaps the proposed memory is being ignored.
:::

::: {.example #example-50}
### Example 50 · The exam from a writer you have never seen

Training on the first half of one author's novels and testing on the second half can reward familiarity with that author's style. A more demanding evaluation holds out entire authors or appropriate source units. The final test remains closed while the design is being changed. Otherwise repeated peeking lets the exam gradually become another training exercise.
:::

Appendix C asks for strictly online states; complete encoder, update, and decoder costs; resource curves over entity, ontology, depth, and residual budgets; matched baselines; name permutation, context shuffling, lexical substitution, and nesting destruction; separate structural and lexical results; author-level book splits; and a final test opened only after the code and metrics are frozen.

Those are requirements for a future evaluation, not completed experiments. This theory paper contains no demonstrated large-scale win on English. A full evaluation should also expose uncertainty in frame boundaries and referent assignment, quantify overflow, and test whether a large unrestricted local state has silently learned to do everything while the named structures sit unused.

## 15. The philosophy beneath the equations {#philosophy}

When I describe a useful state as a small working world, I mean an organized collection of distinctions that changes as evidence arrives. Somebody remains the same person across mentions. A claim remains inside the right person's belief. A promise remains unfinished until the relevant event resolves it. A new observation changes what the machine expects next.

This suggests a way to think about understanding: preserve relationships that continue to matter while allowing irrelevant details to fall away. But “irrelevant” belongs to a task. A detective may need the exact spelling of a name. A poet may care about the rhythm of a sentence. A legal quotation may require the exact words. There is no universal permission to forget the surface of language.

The paper calls its deeper object a **causal quotient**. In plain English, histories may be treated alike when they lead to the same required future-prediction distribution. Imagine two differently worded accounts that leave precisely the same relevant expectations. A good representation would not need to store their superficial differences merely to answer those same questions. Whether a small, learnable approximation exists for broad language tasks is the research question.

The three-part state is one proposed anatomy for that approximation. Its success would depend on learning reliable distinctions and using them economically. It is not proof that these are the only parts of thought, that the brain literally contains this stack, or that a machine with these fields necessarily understands in every philosophical sense.

What the mathematics establishes is narrower and useful: for certain structured problems, exposing the right operations changes the kind of machinery needed; bounded reference can be canonicalized under specified symmetries; and finite-resource errors can be related to explicit failure conditions. What remains open is how far those benefits survive the messiness of language and the full cost of implementation.

My question, after all the notation, is this: **What would a machine need to carry forward so that the next sentence changes the right understanding of the situation?** Building that machine, measuring its costs, and examining its failures is how this proposal can earn its place.

## Reading the original {#continue}

Part II reproduces the complete Theory Version 1.0 manuscript: the abstract, all thirteen sections, proofs, three appendices, and references. The web edition corrects cross-reference labels and retains the supplied PDF unchanged for comparison. The 35 equation-guide labels above are added for this article; the source paper's displayed equations were unnumbered.

[Continue to Part II: Context-Lifted Predictive States](context-lifted-predictive-states-paper.html) · [Download the original PDF](../papers/context-lifted-predictive-states-v1.pdf)
