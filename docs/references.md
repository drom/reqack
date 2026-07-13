## References

Javier de San Pedro, Thomas Bourgeat, Jordi Cortadella
[Specification mining for asynchronous controllers](https://doi.org/10.1109/ASYNC.2016.10)
Asynchronous Circuits and Systems (ASYNC), 2016 22nd IEEE International Symposium on 107-114
DOI: 10.1109/ASYNC.2016.10

Infers formal specifications (state graphs / STGs) from observed I/O traces of asynchronous controllers, so an implementation can be reverse-engineered into a model and re-synthesized or verified. Applies data-mining to signal-transition behavior to reconstruct the underlying concurrency.

Cortadella, Jordi, et al.
["RTL Synthesis: From Logic Synthesis to Automatic Pipelining."](http://upcommons.upc.edu/bitstream/handle/2117/82027/RTLsynthesis.pdf)
Proceedings of the IEEE 103.11 (2015): 2061-2075.
DOI: 10.1109/JPROC.2015.2456189

Survey tracing the evolution from classical logic synthesis toward automatic pipelining and microarchitectural transformation, with elasticity/latency-insensitivity as the substrate that makes pipelining a correctness-preserving transform rather than a manual redesign.

Chatterjee, Satrajit, Michael Kishinevsky, and Umit Y. Ogras.
["xMAS: Quick formal modeling of communication fabrics to enable verification."](https://doi.org/10.1109/MDT.2012.2205998)
Design & Test of Computers, IEEE 29.3 (2012): 80-88.
DOI: 10.1109/MDT.2012.2205998

Introduces eXecutable Micro-Architectural Specification: a small primitive set (queues, functions, forks, joins, switches, merges) for building formal, executable models of on-chip communication fabrics, enabling early liveness/deadlock verification and property derivation before RTL exists.

Cortadella, Jordi, et al.
[Logic synthesis for asynchronous controllers and interfaces](http://www.springer.com/productFlyer_978-3-540-43152-7.pdf?SGWID=0-0-1297-2158934-0).
Vol. 8. Springer Science & Business Media, 2012.

Textbook on synthesizing asynchronous control from Signal Transition Graphs: state encoding, logic decomposition, and hazard-free implementation. Theoretical foundation behind the Petrify toolflow.

Cortadella, Jordi, Marc Galceran-Oms, and Mike Kishinevsky.
["Elastic systems."](http://www.cs.upc.edu/~jordicf/gavina/BIB/files/memocode2010.pdf)
Formal Methods and Models for Codesign (MEMOCODE), 2010 8th IEEE/ACM International Conference on. IEEE, 2010.

Generalizes synchronous elastic circuits into a theory of elastic systems where the timing of data is decoupled from functional correctness via valid/stall handshaking. Establishes the algebra and behavior-preserving transformations (retiming, recycling, bubble insertion).

Galceran-Oms, Marc, et al.
["Automatic microarchitectural pipelining."](https://doi.org/10.1109/DATE.2010.5456910)
Proceedings of the Conference on Design, Automation and Test in Europe. European Design and Automation Association, 2010.
DOI: 10.1109/DATE.2010.5456910

Uses elasticity to automatically insert pipeline stages into a design without changing its function, exploiting latency-insensitivity to add/remove buffering (recycling) and rebalance combinational paths.

Carmona, Josep, et al.
["Elastic circuits."](https://doi.org/10.1109/TCAD.2009.2030436)
Computer-Aided Design of Integrated Circuits and Systems, IEEE Transactions on 28.10 (2009): 1437-1455.
DOI: 10.1109/TCAD.2009.2030436

Canonical journal paper defining synchronous elastic circuits (latency-insensitive at clock granularity): the SELF valid/stop handshake, elastic buffers, join/fork controllers, and equivalence to ordinary synchronous circuits. Core reference for the whole topic.

Casu, Mario R., and Luca Macchiarulo.
["Adaptive latency-insensitive protocols."](http://porto.polito.it/1642487/1/dtc07_paper.pdf)
IEEE Design & Test of Computers 5 (2007): 442-452.

Improves classic latency-insensitive design by adapting to the actual channel latencies at runtime, reducing the throughput penalty of conservatively inserted relay stations.

Cortadella, Jordi, and Mike Kishinevsky.
["Synchronous elastic circuits with early evaluation and token counterflow."](https://www.cs.upc.edu/~jordicf/gavina/BIB/files/dac07_early.pdf)
Proceedings of the 44th annual Design Automation Conference. ACM, 2007.

Adds early evaluation (produce a result before all inputs arrive, e.g. a mux with a known select) and backward-flowing anti-tokens to cancel unneeded computation, breaking the throughput limits of purely eager elastic protocols.

Cortadella, Jordi, Mike Kishinevsky, and Bill Grundmann.
["Synthesis of synchronous elastic architectures."](https://www.cs.upc.edu/~jordicf/gavina/BIB/files/dac06_self.pdf)
Proceedings of the 43rd annual Design Automation Conference. ACM, 2006.

Seminal paper introducing SELF: automatically converting an ordinary synchronous circuit into an elastic one with elastic buffers and controllers, enabling variable-latency units and modular composition.

Ampalam, Manoj, and Montek Singh.
["Counterflow pipelining: Architectural support for preemption in asynchronous systems using anti-tokens."](https://doi.org/10.1109/ICCAD.2006.320024)
Computer-Aided Design, 2006. ICCAD'06. IEEE/ACM International Conference on. IEEE, 2006.
DOI: 10.1109/ICCAD.2006.320024

Asynchronous-domain use of anti-tokens flowing backward through a pipeline to preempt and cancel in-flight computation; a direct precursor to the anti-token mechanism later adopted in elastic circuits.

Brej, C. F., and J. D. Garside.
["Early output logic using anti-tokens."](http://brej.org/papers/iwls_paper.pdf)
International Workshop on Logic Synthesis. 2003.

Introduces anti-tokens in asynchronous early-output logic: negative tokens that annihilate real tokens to discard unneeded results. Origin of the anti-token concept reused throughout later elastic work.

Spars, Jens, and Steve Furber.
[Principles Asynchronous Circuit Design](http://twanclik.free.fr/electricity/electronic/pdfdone12/Principles%20of%20Asynchronous%20Circuit%20Design%20-%20A%20Systems%20Perspective.pdf).
Kluwer Academic Publishers, 2002.

Standard textbook covering handshake protocols, delay models, pipeline styles (bundled-data, dual-rail) and controllers. Background reading for handshake-based elasticity.

Carloni, Luca P., Kenneth L. McMillan, and Alberto L. Sangiovanni-Vincentelli.
["Theory of latency-insensitive design."](http://webcluster.cs.columbia.edu/~luca/research/lipTransactions.pdf)
Computer-Aided Design of Integrated Circuits and Systems, IEEE Transactions on 20.9 (2001): 1059-1076.

Founding theory of latency-insensitive design: patient processes and relay stations make a system tolerant to arbitrary channel latencies while guaranteeing functional equivalence regardless of wire delay. Root of the entire elastic line.

Varshavsky, Victor, Vyacheslav Marakhovsky, and Tam-Anh Chu.
"Logical timing (global synchronization of asynchronous arrays)."
Parallel Algorithms/Architecture Synthesis, 1995. Proceedings., First Aizu International Symposium on. IEEE, 1995.
DOI: 10.1109/AISPAS.1995.401346

Early work on globally synchronizing arrays of asynchronous elements through logical (data-driven) timing instead of a global clock.

Sutherland, Ivan E.
["Micropipelines."](http://f-cpu.seul.org/new/micropipelines.pdf)
Communications of the ACM 32.6 (1989): 720-738.

Turing-award lecture introducing micropipelines: elastic FIFO pipelines built from transition-signaling (event) control and capture-pass latches. Direct ancestor of handshake and elastic pipelining.

### Dynamically-Scheduled HLS / Dataflow

Josipovic, Lana, Radhika Ghosal, and Paolo Ienne.
["Dynamically Scheduled High-level Synthesis."](https://doi.org/10.1145/3174243.3174264)
Proceedings of the 2018 ACM/SIGDA International Symposium on Field-Programmable Gate Arrays (FPGA). ACM, 2018.
DOI: 10.1145/3174243.3174264

First to generate elastic/dataflow circuits directly from C: instead of statically scheduled HLS, emits handshaked dataflow units that schedule at runtime, extracting parallelism from irregular control and memory. Origin of the Dynamatic toolflow.

Josipovic, Lana, Andrea Guerrieri, and Paolo Ienne.
["From C/C++ Code to High-Performance Dataflow Circuits."](https://doi.org/10.1109/TCAD.2021.3105574)
IEEE Transactions on Computer-Aided Design of Integrated Circuits and Systems (TCAD) 41.7 (2022): 2142-2155.
DOI: 10.1109/TCAD.2021.3105574

Comprehensive journal treatment of the Dynamatic flow: full compiler from LLVM IR to elastic dataflow netlists with memory interfaces, plus the buffering and sharing optimizations. Definitive reference for modern elastic HLS.

Josipovic, Lana.
["High-Level Synthesis of Dynamically Scheduled Circuits."](https://doi.org/10.5075/epfl-thesis-7211)
PhD thesis, EPFL, 2021.
DOI: 10.5075/epfl-thesis-7211

Dissertation gathering the dataflow-circuit HLS methodology, buffering theory, and optimizations in one place.

Josipovic, Lana, Shabnam Sheikhha, Andrea Guerrieri, Paolo Ienne, and Jordi Cortadella.
["Buffer Placement and Sizing for High-Performance Dataflow Circuits."](https://doi.org/10.1145/3373087.3375314)
Proceedings of the 2020 ACM/SIGDA International Symposium on Field-Programmable Gate Arrays (FPGA). ACM, 2020.
Extended version: ACM Transactions on Reconfigurable Technology and Systems (TRETS) 15.1 (2022): 1-32. DOI: 10.1145/3477053

MILP formulation that places and sizes elastic buffers to meet a throughput target while breaking combinational cycles for timing closure. Directly extends elastic retiming/recycling theory to generated dataflow circuits.

Josipovic, Lana, Andrea Guerrieri, and Paolo Ienne.
["Speculative Dataflow Circuits."](https://doi.org/10.1145/3289602.3293914)
Proceedings of the 2019 ACM/SIGDA International Symposium on Field-Programmable Gate Arrays (FPGA). ACM, 2019.
DOI: 10.1145/3289602.3293914

Adds speculation to elastic circuits: units issue speculatively and squash on misspeculation via a token/anti-token discard mechanism, raising throughput on control-dependent code.

Josipovic, Lana, et al.
["Resource Sharing in Dataflow Circuits."](https://doi.org/10.1109/FCCM53951.2022.9786084)
2022 IEEE 30th Annual International Symposium on Field-Programmable Custom Computing Machines (FCCM). IEEE, 2022.
Extended version: ACM Transactions on Reconfigurable Technology and Systems (TRETS), 2023. DOI: 10.1145/3597614

Shares expensive functional units among operations in a dataflow circuit without introducing deadlock, using arbitration that respects the elastic handshake and the circuit's throughput constraints.

Xu, Jiahui, Emmet Murphy, Jordi Cortadella, and Lana Josipovic.
["Eliminating Excessive Dynamism of Dataflow Circuits Using Model Checking."](https://doi.org/10.1145/3543622.3573196)
Proceedings of the 2023 ACM/SIGDA International Symposium on Field-Programmable Gate Arrays (FPGA). ACM, 2023.
DOI: 10.1145/3543622.3573196

Uses formal model checking to find where runtime dynamism is unnecessary and replace it with cheaper static scheduling, cutting handshake and buffering overhead without losing correctness.

Elakhras, Ayatallah, Riya Sawhney, Andrea Guerrieri, Lana Josipovic, and Paolo Ienne.
["Straight to the Queue: Fast Load-Store Queue Allocation in Dataflow Circuits."](https://doi.org/10.1145/3543622.3573050)
Proceedings of the 2023 ACM/SIGDA International Symposium on Field-Programmable Gate Arrays (FPGA). ACM, 2023.
DOI: 10.1145/3543622.3573050

Efficient load-store-queue allocation that preserves memory ordering in dataflow circuits with less area and latency than prior LSQ schemes.

Elakhras, Ayatallah, Andrea Guerrieri, Lana Josipovic, and Paolo Ienne.
["Survival of the Fastest: Enabling More Out-of-Order Execution in Dataflow Circuits."](https://doi.org/10.1145/3626202.3637556)
Proceedings of the 2024 ACM/SIGDA International Symposium on Field-Programmable Gate Arrays (FPGA). ACM, 2024.
DOI: 10.1145/3626202.3637556

Enables more out-of-order execution in dataflow circuits, letting independent tokens overtake stalled ones to raise throughput on data-dependent workloads.

Elakhras, Ayatallah, et al.
["Graphiti: Formally Verified Out-of-Order Execution in Dataflow Circuits."](https://doi.org/10.1145/3779212.3790166)
Proceedings of the 2026 International Conference on Architectural Support for Programming Languages and Operating Systems (ASPLOS). ACM, 2026.
DOI: 10.1145/3779212.3790166

Formally verified framework for out-of-order execution in dataflow circuits, proving the correctness of the token reordering that earlier throughput work introduced.

### Asynchronous

Yakovlev, A. V., et al.
["Modelling, analysis and synthesis of asynchronous control circuits using Petri nets."](https://doi.org/10.1016/S0167-9260(96)00010-7)
Integration, the VLSI journal 21.3 (1996): 143-170.
DOI: 10.1016/S0167-9260(96)00010-7

Survey of Petri-net / STG based methods for specifying, analyzing, and synthesizing asynchronous control circuits; groundwork for the concurrency models used in elastic control.

Cortadella, Jordi and Kishinevsky, Michael and Kondratyev, Alex and Lavagno, Luciano and Yakovlev, Alex;
Logic synthesis for asynchronous controllers and interfaces; 2012

Book-length treatment (same as the Springer entry above) of asynchronous controller synthesis from STGs; the reference implementation is the Petrify tool.

### Transformations

Galceran-Oms, Marc, et al.
["Microarchitectural transformations using elasticity."](http://www.cs.upc.edu/~jordicf/gavina/BIB/files/JECTS2011_MicroarchTransform.pdf)
ACM Journal on Emerging Technologies in Computing Systems (JETC) 7.4 (2011): 18.

Shows how elasticity enables correctness-preserving microarchitectural transforms — retiming, recycling, bypasses, variable-latency units — automating transformations that are normally done by hand.

Bufistov, Dmitry E., et al.
["Retiming and recycling for elastic systems with early evaluation."](http://www.cs.upc.edu/~jordicf/Research/gavina/BIB/files/rr_early_dac09.pdf)
Proceedings of the 46th Annual Design Automation Conference. ACM, 2009.

Jointly optimizes retiming (moving registers) and recycling (adding empty buffers) to maximize elastic-system throughput, extended to handle early evaluation.

Carloni, Luca P., and Alberto L. Sangiovanni-Vincentelli.
["Combining Retiming and Recycling to Optimize the Performance of Synchronous Circuits."](http://www1.cs.columbia.edu/~luca/research/rscSBCCI03.pdf)
SBCCI. Vol. 3. 2003.

Shows recycling (inserting empty/bubble stations) complements retiming, and combining both optimizes the throughput of latency-insensitive/synchronous circuits.

### Performance

Júlvez, Jorge, Jordi Cortadella, and Michael Kishinevsky.
["On the performance evaluation of multi-guarded marked graphs with single-server semantics."](http://webdiis.unizar.es/~julvez/pub/09deds.pdf)
Discrete Event Dynamic Systems 20.3 (2010): 377-407.

Analytical throughput evaluation of marked graphs with guards and single-server semantics — the modeling machinery used to compute steady-state throughput of elastic systems.

Ramamoorthy, C. V., and Gary S. Ho.
["Performance evaluation of asynchronous concurrent systems using Petri nets."](http://www.computer.org/csdl/trans/ts/1980/05/01702760.pdf)
Software Engineering, IEEE Transactions on 5 (1980): 440-449.

Classic method for computing cycle time / throughput of concurrent systems modeled as timed Petri nets via critical-cycle (maximum mean cycle) analysis.

Commoner, Frederic, et al.
["Marked directed graphs."](https://doi.org/10.1016/S0022-0000(71)80013-2)
Journal of Computer and System Sciences 5.5 (1971): 511-523.
DOI: 10.1016/S0022-0000(71)80013-2

Foundational theory of marked graphs (a Petri-net subclass): liveness, safeness, and token conservation around cycles. Mathematical basis for elastic throughput analysis.

## DataFlow

Lee, Edward Ashford, and David G. Messerschmitt.
["Static scheduling of synchronous data flow programs for digital signal processing."](https://doi.org/10.1109/TC.1987.5009446)
Computers, IEEE Transactions on 100.1 (1987): 24-35.
DOI: 10.1109/TC.1987.5009446

Defines Synchronous Data Flow: actors with fixed token production/consumption rates, schedulable at compile time via balance equations and periodic schedules. Foundational dataflow model of computation.

Johnston, Wesley M., J. R. Hanna, and Richard J. Millar.
["Advances in dataflow programming languages."](https://doi.org/10.1145/1013208.1013209)
ACM Computing Surveys (CSUR) 36.1 (2004): 1-34.

Survey of the history and concepts of dataflow programming languages, from tagged-token machines to modern dataflow languages.

Benini, Luca, et al.
["Telescopic Units: A New Paradigm for Performance Optimization of VLSI Designs."](http://si2.epfl.ch/~demichel/publications/archive/1998/CADICSvol17iss3Mar98pg220.pdf)
IEEE TRANSACTIONS ON COMPUTER-AIDED DESIGN OF INTEGRATED CIRCUITS AND SYSTEMS 17.3 (1998).

Variable-latency functional units that detect and signal completion early on common-case inputs — a performance technique naturally wrapped by elastic/handshake control.

## DAG

Yu, Cunxi, et al.
["DAG-Aware Logic Synthesis of Datapaths."](http://www.ecs.umass.edu/ece/labs/vlsicad/papers/dac-2016-cunxi-ibm-muxmove.pdf)

Datapath logic synthesis that exploits DAG structure (mux movement, sub-expression sharing) to optimize area and delay.

Mohanty, Saraju P., and N. Ranganathan.
["Energy efficient scheduling for datapath synthesis."](https://doi.org/10.1109/ICVD.2003.1183175)
VLSI Design, 2003. Proceedings. 16th International Conference on. IEEE, 2003.
DOI: 10.1109/ICVD.2003.1183175

High-level-synthesis scheduling that minimizes energy in the resulting datapath under resource and timing constraints.

## Projects

https://github.com/google/autopiper

https://github.com/bvgastel/xmas

https://github.com/Rotsor/phd

https://bitbucket.org/alanmi/abc

https://github.com/EPFL-LAP/dynamatic
