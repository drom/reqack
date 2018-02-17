// edge ${id} EB2a
logic [${I_0_WIDTH - 1}:0] reg0_${id}, reg1_${id};

always @(posedge clk) begin
    if (en0_${id}) reg0_${id} <= ${t_0_data};
    if (en1_${id}) reg1_${id} <= ${t_0_data};
end

assign ${i_0_data} = sel_${id} ? reg1_${id} : reg0_${id};
