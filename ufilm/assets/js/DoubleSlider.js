var bw = require("bootstrap-webpack");
var React = require('react');
var Reflux = require('reflux');
var $ = require('jquery');
var _ = require('underscore');

function sign(x){
    return x === 0 ? 0 : x > 0 ? +1 : -1;
}

function nthroot(x, n){
    return sign(x) * Math.pow(Math.abs(x), 1 / n);
}

function make_cumulative(bins){
    var cum_bins = _.map(bins, function(v, i, a){
        return _.reduce(
            a.slice(0, i), 
            function(m,v){ return m+v }, 
            0
        );
    });
    return [0].concat(bins, [1])
}

function logslider(position, bottom, top) {
  // position will be between 0 and 100
  var minp = 0;
  var maxp = 1;

  // The result should be between 100 an 10000000
  var minv = Math.log(bottom);
  var maxv = Math.log(top);

  // calculate adjustment factor
  var scale = (maxv-minv) / (maxp-minp);

  return Math.exp(minv + scale*(position-minp));
}

function logposition(value, bottom, top) {
    // position will be between 0 and 100
    var minp = 0;
    var maxp = 1;

    // The result should be between 100 an 10000000
    var minv = Math.log(bottom);
    var maxv = Math.log(top);

    // calculate adjustment factor
    var scale = (maxv-minv) / (maxp-minp);
    return (Math.log(value)-minv) / scale + minp;
}

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
            handle_width: 0,
            cum_bins: make_cumulative(this.props.bins),
            normal_cum_bins: make_cumulative(
                _.map(
                    _.range(0,this.props.bins.length),
                    () => 1. / this.props.bins.length
                )
            )
        }
    },
    componentDidMount: function(){
        var container_width = $(this.refs.container.getDOMNode()).innerWidth();
        var handle_width = $(this.refs.left_handle.getDOMNode()).outerWidth();
        this.setState({
            container_width: container_width,
            handle_width: handle_width
        });
        this.setState({
            left_offset: this.valueToOffset(this.props.initial_left, container_width, handle_width),
            right_offset: this.valueToOffset(this.props.initial_right, container_width, handle_width)
        });
    },
    pullToCenter: function(v){
        var magnitude = 2;
        return (
            nthroot((v-0.5) / Math.pow(2, magnitude*2), magnitude*2+1)
        ) + 0.5;
    },
    translateBetweenCumBins: function(v, bins1, bins2){
            var cum_index = _.findIndex(
                bins1,
                (e) => e >= v
            ) - 1;
            var bins1_offset_value = v - bins1[cum_index];
            var c = bins1_offset_value / (bins1[cum_index+1] - bins1[cum_index]);
            return (
                (bins2[cum_index+1] - bins2[cum_index]) * c
            ) + bins2[cum_index];
    },
    binScaledToNormal: function(v){
        if( this.props.bins.length > 0 ){
            var out = this.translateBetweenCumBins(
                v, 
                this.state.cum_bins, 
                this.state.normal_cum_bins
            );
            console.log("bs2n:", v, out);
            return out;
        }else{
            return v;
        }
    },
    normalToBinScaled: function(v){
        if( this.props.bins.length > 0 ){
            var out = this.translateBetweenCumBins(
                v, 
                this.state.normal_cum_bins,
                this.state.cum_bins
            );
            console.log("n2bs:", v, out);
            return out;
        }else{
            return v;
        }
    },
    offsetToValue: function(offset){
        var part_value = offset / ( this.state.container_width - this.state.handle_width );
        var value = this.props.min_value + (
            this.binScaledToNormal(part_value)
        ) * ( this.props.max_value - this.props.min_value );
        value = value > this.props.max_value ? this.props.max_value : value;
        return offset < 1 ? this.props.min_value : value;
    },
    valueToOffset: function(value, container_width=this.state.container_width, handle_width=this.state.handle_width){
        var total_value_width = this.props.max_value - this.props.min_value;
        var value_offset = value - this.props.min_value;
        var part_offset = value_offset / total_value_width;
        var offset = this.normalToBinScaled(part_offset) * ( container_width - handle_width );
        return offset;
    },
    onLeftDown: function(event){
        event.preventDefault();
        var pageX = this.getPageX(event);
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
        var pageX = this.getPageX(event);
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
        $(document).on('touchup.dragging', this.onHandleLeave);        
    },
    onHandleLeave: function(data){
        $(document).off('mousemove.dragging');
        $(document).off('mouseup.dragging');
        $(document).off('touchmove.dragging');
        $(document).off('touchup.dragging');        

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
            var pageX = this.getPageX(event);
            var new_offset = this.state.left_start_offset + pageX - this.state.left_start_pos;
            var container_total_offset = $(this.refs.container.getDOMNode()).outerWidth() - this.state.handle_width + 1;
            if( new_offset < container_total_offset && new_offset <= this.state.right_offset && new_offset >= 0 ){
                this.setState({
                    left_offset: new_offset,
                    left_value: this.roundValue(this.offsetToValue(new_offset))
                });
            }
        }
        if( this.state.is_right_dragging ){
            var pageX = this.getPageX(event);
            var new_offset = this.state.right_start_offset + pageX - this.state.right_start_pos;
            var container_total_offset = $(this.refs.container.getDOMNode()).outerWidth() - this.state.handle_width + 1;
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
    render: function() {
        var container_style = {
            height: "20px", 
            position: "relative",
        };
        var handle_style = {
            position: "absolute",
            width: "10px",
            height: "20px",
            backgroundColor: "lightgrey",
            border: "1px solid grey",
            borderRadius: "5px",
        };
        return <div className="row">
            <div className="col-xs-3">
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
            <div className="col-xs-8" ref="container" style={container_style}>
                <div style={{
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
                <div style={{
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
        </div>
    }
});

module.exports = DoubleSlider;