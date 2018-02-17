// edge ${id} EB1
logic en_${id};

assign en_${id} = ${t_0_valid} & ${i_0_ready};

assign ${t_0_ready} = ~${t_0_valid} | ${i_0_ready};

always @(posedge clk or negedge reset_n)
    if (~reset_n) ${i_0_valid} <= 1'b0;
    else          ${i_0_valid} <= ~${i_0_ready} | ${t_0_valid};
