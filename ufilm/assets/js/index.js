var bw = require("bootstrap-webpack");
var React = require('react');
var Reflux = require('reflux');
var $ = require('jquery');
var _ = require('underscore');
var DoubleSlider = require('./DoubleSlider');
var CheckBoxSet = require('./CheckBoxSet');
var TitleBox = require('./TitleBox');
var listing_config = {};
var listing = {};

var config_actions = Reflux.createActions([
    "updateConfigCheckbox",
    "updateConfigRange",
    "updateSorters",
    "toggleFeature",
    "loadMore"
]);

var listing_store = Reflux.createStore({
    listenables: [config_actions],
    updateListing: function(){
        $.get(
            listing_config.listing_url, 
            get_compiled_listing_config()
        ).done(function(data){
            listing = data;
            this.trigger(listing);
        }.bind(this));
    },
    onLoadMore: function(){
        $.get(
            listing.next, 
            get_compiled_listing_config()
        ).done(function(data){
            var temp_listing = data;
            temp_listing.results = listing.results.concat(data.results);
            listing = temp_listing;
            this.trigger(listing);
        }.bind(this));        
    },
    getListingState: function(){
        return listing_config;
    },
    onUpdateConfigCheckbox: function(set_key, option_node) {
        var current = listing_config.checkboxes.sets[set_key].options[option_node];
        current.value = current.value ? false : true;
        this.trigger(listing_config);
        this.updateListing();
    },
    onUpdateConfigRange: function(set_key, left_value, right_value) {
        console.log(set_key, left_value, right_value);

        var current = listing_config.sliders.sets[set_key];
        current.left_value = left_value;
        current.right_value = right_value;
        this.trigger(listing_config);
        this.updateListing();
    },
    onUpdateSorters: function(key, value){
        listing_config.sorters[key].value = value;
        this.trigger(listing_config);
        this.updateListing();
    },
    onToggleFeature: function(key){
        listing_config.features[key][1] = listing_config.features[key][1] ? false : true;
        this.trigger(listing_config);
        this.updateListing();
    }
});


var App = React.createClass({
    mixins: [Reflux.connect(listing_store,"config")],
    onDoubleRangeChange: function(set_key, left_value, right_value){
        config_actions.updateConfigRange(set_key, left_value, right_value);
    },
    onSorterChange: function(e){
        config_actions.updateSorters(
            $(e.target).attr("name"),
            $(e.target).find(":selected").val()
        );
    },
    onChangeInclude: function(e){
        config_actions.toggleFeature(
            $(e.target).attr("name")
        );
    },
    loadMore: function(){
        config_actions.loadMore();
    },
    render: function() {
        return <div className="container" key={this.props.key}>
            <div id='listing_config'>
                <div className="panel panel-default">
                    <div className="panel-body">
                    { 
                        listing_config.sliders.order.map(
                            (key, i) => <DoubleSlider 
                                            change_callback={this.onDoubleRangeChange}
                                            key={key}
                                            data_key={key} 
                                            label={listing_config.sliders.sets[key].label} 
                                            round={listing_config.sliders.sets[key].round} 
                                            min_value={listing_config.sliders.sets[key].min} 
                                            max_value={listing_config.sliders.sets[key].max} 
                                            initial_left={listing_config.sliders.sets[key].left_value} 
                                            initial_right={listing_config.sliders.sets[key].right_value} 
                                            bins={
                                                listing_config.sliders.sets[key].hasOwnProperty('bins') ?
                                                listing_config.sliders.sets[key].bins : []
                                            }
                                        />
                        )
                    }
                    </div>
                </div>
                <div className="panel-group" id="accordion" role="tablist" aria-multiselectable="true">
                {
                    listing_config.checkboxes.order.map(
                        (key, i) => <CheckBoxSet 
                                        key={key} 
                                        label={key} 
                                        options={listing_config.checkboxes.sets[key].options}
                                        onCheckBoxChange={config_actions.updateConfigCheckbox}
                                    />
                    )                
                }
                </div>
                <div className="panel panel-default">
                    <div className="panel-body">

                        <strong>Sort by:&nbsp;</strong>
                        <select name="sortby" onChange={this.onSorterChange}>
                        {
                            listing_config.sorters.sortby.options.map(
                                (pair, i) => <option key={"sortby"+i} value={pair[1]} defaultValue={
                                        pair[1] == listing_config.sorters.sortby.value ? true : false
                                    }>
                                        {pair[0]}
                                    </option>
                            )
                        }
                        </select>
                        &nbsp;
                        <select name="order" onChange={this.onSorterChange}>
                        {
                            listing_config.sorters.order.options.map(
                                (pair, i) => <option key={"order"+i} value={pair[1]} defaultValue={
                                        pair[1] == listing_config.sorters.order.value ? true : false
                                    }>
                                        {pair[0]}
                                    </option>
                            )
                        }
                        </select>

                        <strong style={{ marginLeft: "20px" }}>Include:</strong>&nbsp;
                        {
                            listing_config.features.order.map(
                                (key, i) => <span style={{marginLeft: "6px", marginRight: "6px"}} key={"feature-"+key}>
                                        <span>{listing_config.features[key][0]}</span>&nbsp;
                                        <input 
                                            type="checkbox" 
                                            name={key} 
                                            checked={
                                                listing_config.features[key][1] ? 
                                                true : false
                                            }
                                            onChange={this.onChangeInclude}
                                        />
                                    </span>
                            )
                        }
                    </div>
                </div>
            </div>
            <div id='listing'>
                {
                    listing.hasOwnProperty('results') ?
                        listing.results.map(
                            (title, i) => <TitleBox 
                                            key={"titlebox-"+i} 
                                            title={title}
                                            width='162px'
                                            height='240px'
                                           />
                        )
                    :
                        ""
                }
                { listing.next ?
                    <a href="javascript:;" onClick={this.loadMore}>
                        <div style={{
                            fontSize: '30px', 
                            color: 'orange',
                            width: '162px',
                            height: '240px',
                            float: "left",
                            paddingTop: '80px',
                            paddingLeft: '30px'
                        }}>
                            More...
                        </div>
                    </a> : ""
                }
            </div>
        </div>;
    }
});

function get_compiled_listing_config(){
    var compiled_listing = {};
    Object.keys(listing_config.sliders.sets).forEach(function(key){
        var slider = listing_config.sliders.sets[key];
        compiled_listing[key+"_min"] = slider.left_value;
        compiled_listing[key+"_max"] = slider.right_value;
    });
    Object.keys(listing_config.checkboxes.sets).forEach(function(key){
        var checkbox_set = listing_config.checkboxes.sets[key];
        compiled_listing[key+"_included"] = Object.keys(checkbox_set.options).filter(
            i => checkbox_set.options[i].value
        ).join(',');
    });
    Object.keys(listing_config.features).forEach(function(key){
        compiled_listing[key] = listing_config.features[key][1] ? "true" : "false";
    });
    compiled_listing["sortby"] = listing_config.sorters.sortby.value;
    compiled_listing["order"] = listing_config.sorters.order.value;
    return compiled_listing;
}

$(document).ready(function(){

    React.initializeTouchEvents(true);
    
    $.ajax("/").done(function(data){
        listing_config = JSON.parse(data);
        console.log(listing_config);
        React.render(<App />, document.getElementById('content'));
        listing_store.updateListing();
    });
    
});
