module custom_3_1 #(
    parameter T_0_WIDTH = 1,
    parameter T_1_WIDTH = 1,
    parameter T_2_WIDTH = 1,
    parameter I_0_WIDTH = 1

) (
    input        [T_0_WIDTH-1 : 0] t_0_data,
    input        [T_1_WIDTH-1 : 0] t_1_data,
    input        [T_2_WIDTH-1 : 0] t_2_data,
    output logic [I_0_WIDTH-1 : 0] i_0_data
);

assign i_0_data = t_0_data ^ t_1_data ^ t_2_data;

endmodule
