var bw = require("bootstrap-webpack");
var React = require('react');
var $ = require('jquery');

var LOG_MAX = 10;

var DoubleSlider = React.createClass({

    getDefaultProps: function(){
        return {
            label: "",
            min_value: 0,
            max_value: 100,
            initial_left: 0,
            initial_right: 0,
            round: 0
        }
    },
    
    getInitialState: function(){
        return {
            left_z: 100,
            right_z: 10,
            left_offset: 0,
            right_offset: 0,
            left_value: this.props.initial_left,
            right_value: this.props.initial_right,
            is_left_dragging: false,
            is_right_dragging: false,
            left_start_pos: 0,
            right_start_pos: 0,
            left_start_offset: 0,
            handle_width: 0
        }
    },

    componentDidMount: function(){
        let container_width = $(this.refs.container.getDOMNode()).innerWidth();
        let handle_width = $(this.refs.left_handle.getDOMNode()).outerWidth();
        this.setState({
            container_width: container_width,
            handle_width: handle_width
        });
        this.setState({
            left_offset: this.valueToOffset(
                this.props.initial_left, 
                container_width, 
                handle_width
            ),
            right_offset: this.valueToOffset(
                this.props.initial_right, 
                container_width, 
                handle_width
            )
        });
    },

    logOffsetToValue: function(offset, maxp=1){
        let exp_min=Math.exp(1), exp_max=Math.exp(LOG_MAX);
        let range=1, exp_range=exp_max-exp_min;
        let c = range / (exp_range);
        let result = (
            Math.exp(
                offset*LOG_MAX
            )
        ) * c;
        return result;
    },

    logValueToOffset: function(value, maxp=1){
        let log_min=Math.log(0.0006), log_max=Math.log(LOG_MAX);
        let range=1, log_range=log_max-log_min;
        let c = range / (log_range);
        let result = (
            Math.log(
                (value*LOG_MAX)+0.0006
            ) - Math.log(0.0006)
        ) * c;
        return result;
    },

    offsetToValue: function(offset, container_width=this.state.container_width, handle_width=this.state.handle_width){
        let bar_inside_width = this.state.container_width - this.state.handle_width;
        let value_range = this.props.max_value - this.props.min_value;
        let part_value = offset / bar_inside_width;
        part_value = this.props.log_scale ? this.logOffsetToValue(part_value) : part_value;
        let value = this.props.min_value + part_value*value_range;

        value = value > this.props.max_value ? this.props.max_value : value;
        return offset < 1 ? this.props.min_value : value;
        
    },

    valueToOffset: function(value, container_width=this.state.container_width, handle_width=this.state.handle_width){
        let bar_inside_width = this.state.container_width - this.state.handle_width;
        let total_value_width = this.props.max_value - this.props.min_value;
        let value_offset = value - this.props.min_value;
        let part_offset = value_offset / total_value_width;
        part_offset = this.props.log_scale ? this.logValueToOffset(part_offset) : part_offset;
        let offset = part_offset * ( container_width - handle_width );
        return offset;
    },

    onLeftDown: function(event){
        event.preventDefault();
        let pageX = this.getPageX(event);
        this.setState({
            is_left_dragging: true,
            left_start_pos: pageX,
            left_start_offset: $(this.refs.left_handle.getDOMNode()).position().left,
            left_z: 100,
            right_z: 10
        });
        $(this.refs.left_handle.getDOMNode()).css({
            backgroundColor: "lightgrey"
        });
        $(document).on('mousemove.dragging', this.onMove);
        $(document).on('mouseup.dragging', this.onHandleLeave);
        $(document).on('touchmove.dragging', this.onMove);
        $(document).on('touchend.dragging', this.onHandleLeave);

    },

    onRightDown: function(data){
        event.preventDefault();
        let pageX = this.getPageX(event);
        this.setState({
            is_right_dragging: true,
            right_start_pos: pageX,
            right_start_offset: $(this.refs.right_handle.getDOMNode()).position().left,
            left_z: 10,
            right_z: 100
        });
        $(this.refs.right_handle.getDOMNode()).css({
            backgroundColor: "lightgrey"
        });
        $(document).on('mousemove.dragging', this.onMove);
        $(document).on('mouseup.dragging', this.onHandleLeave);
        $(document).on('touchmove.dragging', this.onMove);
        $(document).on('touchend.dragging', this.onHandleLeave);        
    },

    onHandleLeave: function(data){
        $(document).off('mousemove.dragging');
        $(document).off('mouseup.dragging');
        $(document).off('touchmove.dragging');
        $(document).off('touchend.dragging');        

        $(this.refs.left_handle.getDOMNode()).css({
            backgroundColor: "lightgrey"
        });
        $(this.refs.right_handle.getDOMNode()).css({
            backgroundColor: "lightgrey"
        });
        this.setState({
            is_left_dragging: false,
            is_right_dragging: false,
        });
        if( typeof this.props.change_callback != "undefined" ){
            this.props.change_callback(this.props.data_key, this.state.left_value, this.state.right_value);
        }
    },

    getPageX: function(event){
        if( event.type == "touchmove" ){
            return event.originalEvent.targetTouches[0].pageX;
        }else if( event.type == "touchstart" ){
            return event.touches[0].pageX;
        }else{
            return event.pageX;
        }
    },

    roundValue: function(value){
        return parseFloat(value.toFixed(this.props.round))
    },

    onMove: function(event){
        if( this.state.is_left_dragging ){
            let pageX = this.getPageX(event);
            let new_offset = this.state.left_start_offset + pageX - this.state.left_start_pos;
            let container_total_offset = $(this.refs.container.getDOMNode()).outerWidth() - this.state.handle_width + 1;
            if( new_offset < container_total_offset && new_offset <= this.state.right_offset && new_offset >= 0 ){
                this.setState({
                    left_offset: new_offset,
                    left_value: this.roundValue(this.offsetToValue(new_offset))
                });
            }
        }
        if( this.state.is_right_dragging ){
            let pageX = this.getPageX(event);
            let new_offset = this.state.right_start_offset + pageX - this.state.right_start_pos;
            let container_total_offset = $(this.refs.container.getDOMNode()).outerWidth() - this.state.handle_width + 1;
            if( new_offset < container_total_offset && new_offset >= this.state.left_offset && new_offset >= 0 ){
                this.setState({
                    right_offset: new_offset,
                    right_value: this.roundValue(this.offsetToValue(new_offset))
                });
            }            
        } 
    },

    onLeftMouseEnter: function(event){
        if( ! this.state.is_left_dragging ){
            $(event.target).css({backgroundColor:"#F5D3B7"});
        }
    },

    onLeftMouseLeave: function(event){
        if( ! this.state.is_left_dragging ){
            $(event.target).css({backgroundColor:"lightgrey"});
        }
    },

    onRightMouseEnter: function(event){
        if( ! this.state.is_right_dragging ){
            $(event.target).css({backgroundColor:"#F5D3B7"});
        }
    },

    onRightMouseLeave: function(event){
        if( ! this.state.is_right_dragging ){
            $(event.target).css({backgroundColor:"lightgrey"});
        }
    },

    render: function(){
        let container_style = {
            height: "20px", 
            position: "relative",
            marginTop: "4px"
        };
        let handle_style = {
            position: "absolute",
            width: "20px",
            height: "20px",
            backgroundColor: "lightgrey",
            border: "1px solid grey",
            borderRadius: "5px",
        };
        return (<div className="row double-slider">
            <div className="col-lg-3 col-xs-12">
                <div className="row">
                    <div className="col-xs-2">
                        <em>{this.props.label}:</em>
                    </div>
                    <div className="left-value col-xs-4">
                        {this.state.left_value}
                    </div>
                    <div className="col-xs-1">
                        -
                    </div>
                    <div className="right-value col-xs-4">
                        {this.state.right_value}
                    </div>
                </div>
            </div>
            <div className="col-xs-12 col-lg-8" ref="container" style={container_style}>
                <div className="rail" style={{
                    position: "absolute", 
                    height: "10px",
                    backgroundColor: "#f0f0f0", 
                    top: "5px", 
                    left: Math.floor(this.state.handle_width/2)+"px", 
                    right: Math.floor(this.state.handle_width/2)+"px",
                    borderRadius: "6px",
                    border: "1px solid lightgrey"
                }}>
                </div>
                <div className="rail-active" style={{
                    position: "absolute", 
                    height: "10px", 
                    backgroundColor: "orange", 
                    top: "5px", 
                    left: Math.floor(this.state.left_offset+this.state.handle_width/2)+"px", 
                    width: Math.floor(this.state.right_offset-this.state.left_offset-this.state.handle_width/2)+"px",
                    border: "1px solid darkorange"
                }}> 
                </div>

                <div className={"handle"} onMouseDown={this.onLeftDown} onTouchStart={this.onLeftDown} onMouseEnter={this.onLeftMouseEnter} onMouseLeave={this.onLeftMouseLeave} style={$.extend({}, handle_style, {
                    zIndex: this.state.left_z,
                    left: this.state.left_offset
                })} ref="left_handle"></div>

                <div className={"handle"} onMouseDown={this.onRightDown} onTouchStart={this.onRightDown} onMouseEnter={this.onRightMouseEnter} onMouseLeave={this.onRightMouseLeave} style={$.extend({}, handle_style, {
                    zIndex: this.state.right_z,
                    left: this.state.right_offset
                })} ref="right_handle"></div>

            </div>
        </div>);
    }
});

module.exports = DoubleSlider;