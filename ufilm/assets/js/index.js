var bw = require("bootstrap-webpack");
var React = require('react');
var Reflux = require('reflux');
var $ = require('jquery');

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

function is_small_device(){
    var check = false;
    (function(a){
        if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))){
            check = true;
        }
    })(navigator.userAgent||navigator.vendor||window.opera);
    return check;
}

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
            let temp_listing = data;
            temp_listing.results = listing.results.concat(data.results);
            listing = temp_listing;
            this.trigger(listing);
        }.bind(this));        
    },
    getListingState: function(){
        return listing_config;
    },
    onUpdateConfigCheckbox: function(set_key, option_node) {
        let current = listing_config.checkboxes.sets[set_key].options[option_node];
        current.value = current.value ? false : true;
        this.trigger(listing_config);
        this.updateListing();
    },
    onUpdateConfigRange: function(set_key, left_value, right_value) {
        console.log(set_key, left_value, right_value);

        let current = listing_config.sliders.sets[set_key];
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
    
    getDefaultProps: function(){
        return {
            select_classes: "form-control " + (is_small_device() ? "input-lg" : "")
        }
    },

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
        return <div className="container-fluid" key={this.props.key}>
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
                                            log_scale={
                                                listing_config.sliders.sets[key].hasOwnProperty('log_scale') ?
                                                listing_config.sliders.sets[key].log_scale : false
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
                <div className="panel panel-default sorters">
                    <div className="panel-body">

                        <div className="col-xs-12 col-lg-6">
                            <div className="col-xs-4 col-lg-2">
                            <strong>Sort by:&nbsp;</strong>
                            </div>
                            <div className="col-xs-4 col-lg-2">
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
                            </div>
                            <div className="col-xs-4 col-lg-2">
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
                            </div>
                        </div>

                        <div className="col-xs-12 col-lg-6">
                            <strong>Include:</strong>&nbsp;
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
            </div>
            <div id='listing'>
                {
                    listing.hasOwnProperty('results') ?
                        listing.results.map(
                            (title, i) => <TitleBox 
                                            key={"titlebox-"+i} 
                                            title={title}
                                            go_big={is_small_device() ? true : false}
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
    let compiled_listing = {};
    Object.keys(listing_config.sliders.sets).forEach(function(key){
        let slider = listing_config.sliders.sets[key];
        compiled_listing[key+"_min"] = slider.left_value;
        compiled_listing[key+"_max"] = slider.right_value;
    });
    Object.keys(listing_config.checkboxes.sets).forEach(function(key){
        let checkbox_set = listing_config.checkboxes.sets[key];
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
    
    $.ajax("/init/").done(function(data){
        listing_config = data;
        React.render(<App />, document.getElementById('content'));
        listing_store.updateListing();
    });
    
});
