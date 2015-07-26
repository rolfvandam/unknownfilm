
var bw = require("bootstrap-webpack");
var React = require('react');
var Reflux = require('reflux');
var $ = require('jquery');
var Draggable = require('react-draggable');

var test_state = {
    presscount: 0,
    text: "test",
    position: {
        x: 0,
        y: 0
    },
    box_left: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
    box_right: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    }

};

var test_actions = Reflux.createActions([
    "changeText"
]);

var test_store = Reflux.createStore({
    listenables: [test_actions],
    getTestState: function(){
        return test_state;
    },
    onChangeText: function(new_text) {
        test_state.text = new_text;
        console.log("oct", new_text);
        this.trigger(test_state.text);
    }
});

var Test = React.createClass({
    mixins: [Reflux.connect(test_store,"text")],
    getInitialState: function(){
        return test_store.getTestState();
    },
    handleClick: function() {

    },
    handleChange: function(e){
        test_actions.changeText(this.refs.text.getDOMNode().value);
        e.preventDefault();
    },
    updateHandleBounds: function(){
        var right_handle = $(this.refs.right_handle.getDOMNode());
        var left_handle = $(this.refs.left_handle.getDOMNode());
        var container = $(this.refs.container.getDOMNode());
        var container_offset = $(container).offset().left;
        var right_handle_offset = $(right_handle).offset().left + ($(right_handle).outerWidth()/2) - container_offset;
        var left_handle_offset = $(left_handle).offset().left + ($(left_handle).outerWidth()/2) - container_offset;
        var min_right_handle = left_handle_offset;
        var max_left_handle = right_handle_offset;
        var max_right_handle = $(container).outerWidth() - ($(right_handle).outerWidth() / 2);
        console.log(left_handle_offset, right_handle_offset, min_right_handle, max_left_handle, max_right_handle, right_handle_offset-max_right_handle);
        this.setState({
            box_left: {
                top: 0,
                bottom: 0,
                right: max_left_handle - ($(left_handle).outerWidth() / 2),
                left: -($(left_handle).outerWidth() / 2)
            },
            box_right: {
                top: 0,
                bottom: 0,
                right: max_right_handle,
                left: min_right_handle - ($(right_handle).outerWidth() / 2)
            },
        });

    },
    componentDidMount: function(){        
        this.updateHandleBounds();
    },
    onStart: function (e, ui) {
        console.log(ui.position.y);
    },
    onStopLeft: function (e, ui) {
        this.updateHandleBounds();
        this.setState({
            left_z: 100,
            right_z: 10
        });
    },
    onStopRight: function (e, ui) {
        this.updateHandleBounds();
        this.setState({
            left_z: 100,
            right_z: 10
        });
    },
    render: function() {
        return <div>
                Pressed {this.state.presscount} times
            <div>
            <button className="btn btn-small btn-primary" onClick={this.handleClick}>
                {this.state.text}
            </button>
            <input type="text" ref="text" value={this.state.text} onChange={this.handleChange}></input>
            </div>
            <div ref="container" style={{backgroundColor: "lightgrey", width: "50%", height: "20px", marginLeft: "100px"}}>
                <Draggable axis="x" bounds={this.state.box_left} zIndex={this.state.left_z} onStop={this.onStopLeft}>
                    <button style={{position: "absolute"}} ref="left_handle">left</button>
                </Draggable>
                <Draggable axis="x" bounds={this.state.box_right} zIndex={this.state.right_z} onStop={this.onStopRight}>
                    <button style={{position: "absolute"}} ref="right_handle">right</button>
                </Draggable>
            </div>
        </div>
    }
});

var DoubleRange = React.createClass({
    getInitialState: function(){
        return $.extend({}, {
            box_left: {
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            },
            box_right: {
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            },
            initial_right_offset: 0,
            test: 0
        }, this.props);
    },
    updateHandleBounds: function(){
        var right_handle = $(this.refs.right_handle.getDOMNode());
        var left_handle = $(this.refs.left_handle.getDOMNode());
        var container = $(this.refs.container.getDOMNode());
        var container_offset = $(container).offset().left;
        var right_handle_offset = $(right_handle).offset().left + ($(right_handle).outerWidth()/2) - container_offset;
        var left_handle_offset = $(left_handle).offset().left + ($(left_handle).outerWidth()/2) - container_offset;
        var min_right_handle = left_handle_offset;
        var max_left_handle = right_handle_offset;
        var max_right_handle = $(container).outerWidth() - ($(right_handle).outerWidth() / 2);
        console.log($(right_handle).offset().left, $(right_handle).position().left, $(left_handle).offset().left, left_handle_offset, right_handle_offset, min_right_handle, max_left_handle, max_right_handle, right_handle_offset-max_right_handle);
        this.setState({
            box_left: {
                top: 0,
                bottom: 0,
                right: max_left_handle - ($(left_handle).outerWidth() / 2),
                left: -($(left_handle).outerWidth() / 2)
            },
            box_right: {
                top: 0,
                bottom: 0,
                right: max_right_handle - this.state.initial_right_offset,
                left: min_right_handle - ($(right_handle).outerWidth() / 2) - this.state.initial_right_offset
            },
        });

    },
    componentDidMount: function(){
        this.setState({
            initial_right_offset: $(this.refs.container.getDOMNode()).outerWidth() * 0.5
        });
        this.updateHandleBounds();
        this.setState(this.getPositions());
        this.updateHandleBounds();
    },
    onStartLeft: function (e, ui) {
        this.setState({
            left_z: "100",
            right_z: "10"
        });
    },
    onStartRight: function (e, ui) {
        this.setState({
            left_z: "10",
            right_z: "100"
        });
    },
    onStopLeft: function (e, ui) {
        this.updateHandleBounds();
    },
    onStopRight: function (e, ui) {
        this.updateHandleBounds();
    },
    /*
    onClickBla: function(){
        console.log("bla");
        this.setState({test: 100});
    },
    */
    getPositions: function(){
        var right_handle = $(this.refs.right_handle.getDOMNode());
        var left_handle = $(this.refs.left_handle.getDOMNode());
        var container = $(this.refs.container.getDOMNode());
        var container_width = $(container).innerWidth();
        var container_offset = $(container).offset().left;
        var right_handle_offset = $(right_handle).offset().left + ($(right_handle).outerWidth()/2) - container_offset;
        var left_handle_offset = $(left_handle).offset().left + ($(left_handle).outerWidth()/2) - container_offset;
        return {
            left_value: left_handle_offset / container_width, 
            right_value: right_handle_offset / container_width
        };
    },
    onDrag: function (e, ui) {
        this.setState(this.getPositions());
    },
    getStart: function(){
        return 100;
    },
    render: function() {
        var block_width = "20px";
        var container_style = {
            width: "50%", 
            height: block_width, 
            marginLeft: "100px",
            position: "relative",
        };
        var handle_style = {
            position: "absolute",
            width: block_width,
            height: block_width,
            backgroundColor: "grey",
            borderRadius: "5px",
        };
        var drags = {axis: "x", onDrag: this.onDrag};
        return <div>
            <div ref="container" style={container_style}>
                <div style={{
                    position: "absolute", 
                    height: "6px", 
                    backgroundColor: "#f0f0f0", 
                    top: "7px", 
                    left: "0px", 
                    right: "0px",
                    borderRadius: "6px",
                    border: "1px solid lightgrey"
                }}>
                </div>
                <Draggable bounds={this.state.box_left} onStop={this.onStopLeft} onStart={this.onStartLeft} {...drags}>
                    <div style={$.extend({}, handle_style, {
                        zIndex: this.state.left_z
                    })} ref="left_handle"></div>
                </Draggable>
                <Draggable bounds={this.state.box_right} onStop={this.onStopRight} onStart={this.onStartRight} {...drags}>
                    <div style={$.extend({}, handle_style, {
                        zIndex: this.state.right_z,
                        backgroundColor: "blue",
                        left: this.state.initial_right_offset
                    })} ref="right_handle"></div>
                </Draggable>
            </div>
            <p>{this.state.left_value} - {this.state.right_value}</p>
        </div>
    }
});

var Test2 = React.createClass({
    render: function() {
        return <div>
            <DoubleRange min_value={100} max_value={1000} initial_left={150} initial_right={500} />
        </div>
    }
});

$(document).ready(function(){
    React.render(<Test2 />, document.getElementById('content'));
});