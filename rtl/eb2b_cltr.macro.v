logic en0_${id}, en1_${id}, sel_${id};

eb2b_ctrl uctrl_${id} (
    .t_0_valid(${t_0_valid}), .t_0_ready(${t_0_ready}),
    .i_0_valid(${i_0_valid}), .i_0_ready(${i_0_ready}),
    .en0(en0_${id}), .en1(en1_${id}), .sel(sel_${id}),
    .clk(clk), .reset_n(reset_n)
);
