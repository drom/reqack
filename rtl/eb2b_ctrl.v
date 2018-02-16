module eb2b_ctrl #(
    parameter S0 = 5'b00001,
    parameter S1 = 5'b00010,
    parameter S2 = 5'b00100,
    parameter S3 = 5'b01000,
    parameter S4 = 5'b10000
) (
    input  clk, reset_n,
    input        t_0_valid,
    output logic t_0_ready,
    output logic i_0_valid,
    output logic en0, en1, sel,
    input        i_0_ready
);

endmodule
